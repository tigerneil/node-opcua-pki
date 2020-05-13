// tslint:disable:variable-name
// tslint:disable:no-shadowed-variable

Error.stackTraceLimit = Infinity;
import * as fs from "fs";
import * as path from "path";
import should = require("should");

import { Certificate, readCertificate, readCertificateRevocationList } from "node-opcua-crypto";
import {
    CertificateAuthority,
    CertificateAuthorityOptions,
    CertificateManager,
    CertificatePurpose,
    ErrorCallback,
    Filename,
    KeySize,
    Params
} from "..";
import { beforeTest } from "./helpers";

// ------------------------------------------------- some useful dates
function get_offset_date(date: Date, nb_days: number): Date {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + nb_days);
    return d;
}

const today = new Date();
const lastYear = get_offset_date(today, -365);
const nextYear = get_offset_date(today, 365);
const yesterday = get_offset_date(today, -1);

describe("test certificate validation", function (this: Mocha.Suite) {

    let certificateAuthority: CertificateAuthority;

    let otherCertificateAuthority: CertificateAuthority;

    let certificate_out_of_date: Filename;
    let certificate_not_yet_active: Filename;
    let certificate_valid: Filename;
    let certificate_valid_untrusted: Filename;
    let certificate_valid_signed_with_other_CA: Filename;

    const testData = beforeTest(this);

    let certificateManager: CertificateManager;

    /**
     * @method createCertificate
     * @param params
     * @param params.applicationUri
     * @param params.dns
     * @param callback
     */
    async function createSignedCertificate(
        certificate: Filename,
        params: Params,
        certificateAuthority: CertificateAuthority
    ) {

        // create a signing request
        const theCertificateRequest = await certificateManager.createCertificateRequest(params);

        fs.existsSync(certificate).should.eql(false, certificate + " should not exist");
        fs.existsSync(theCertificateRequest).should.eql(true);

        // ask the Certificate Authority to sign the certificate
        await certificateAuthority.signCertificateRequest(
            certificate,
            theCertificateRequest,
            params);

        fs.existsSync(theCertificateRequest).should.eql(true);
        fs.existsSync(certificate).should.eql(true);
    }

    before(async () => {

        const optionsCA: CertificateAuthorityOptions = {
            keySize: 2048 as KeySize,
            location: path.join(testData.tmpFolder, "TEST_CA")
        };
        certificateAuthority = new CertificateAuthority(optionsCA);
        await certificateAuthority.initialize();

        // create an other certificate authority
        otherCertificateAuthority = new CertificateAuthority({ keySize: 2048, location: path.join(testData.tmpFolder, "OTHER_CA") });
        await otherCertificateAuthority.initialize();

        const optionsPKI = { location: path.join(testData.tmpFolder, "TEST_PKI") };
        certificateManager = new CertificateManager(optionsPKI);

        await certificateManager.initialize();

        certificate_out_of_date = path.join(testData.tmpFolder, "certificate_out_of_date.pem");
        await createSignedCertificate(certificate_out_of_date,
            { applicationUri: "SOMEURI", startDate: lastYear, validity: 300 }, certificateAuthority);

        certificate_not_yet_active = path.join(testData.tmpFolder, "certificate_notyetactive.pem");
        await createSignedCertificate(certificate_not_yet_active,
            { applicationUri: "SOMEURI", startDate: nextYear, validity: 10000 }, certificateAuthority);

        certificate_valid = path.join(testData.tmpFolder, "certificate_valid.pem");
        await createSignedCertificate(certificate_valid,
            { applicationUri: "SOMEURI", startDate: yesterday, validity: 10 }, certificateAuthority);

        certificate_valid_untrusted = path.join(testData.tmpFolder, "certificate_valid_untrusted.pem");
        await createSignedCertificate(certificate_valid_untrusted,
            { applicationUri: "SOMEURI", startDate: yesterday, validity: 10 }, certificateAuthority);

        certificate_valid_signed_with_other_CA = path.join(testData.tmpFolder, "certificate_valid_from_other_CA.pem");
        await createSignedCertificate(certificate_valid_signed_with_other_CA,
            { applicationUri: "SOMEURI", startDate: yesterday, validity: 10 }, otherCertificateAuthority);

        /*
    (callback: ErrorCallback) => {
        certificate_valid_revoked = path.join(test.tmpFolder, "certificate_valid_revoked.pem");
        createCertificate(certificate_valid_revoked,
             {applicationUri: "SOMEURI", startDate: yesterday, validity: 10 },callback)
    },
    (callback: ErrorCallback) => {
        certificateAuthority.revokeCertificate(certificate_valid_revoked,{reason: "keyCompromise"},callback);
    },
    (callback: ErrorCallback) => {
        const ca_with_crl_filename = certificateAuthority.caCertificateWithCrl;
        fs.existsSync(ca_with_crl).should.eql(true);
        const ca_with_crl = crypto_utils.readKeyPem(ca_with_crl_filename);
        certificateManager.setCACertificate(ca_with_crl);
        // simulate certificateManager receiving Certificate Revocation list
        callback();
    }
    */
    });

    describe("should verify ", () => {

        let localCertificateManager: CertificateManager;

        let cert1: Certificate;
        let cert2: Certificate;
        let cert3: Certificate;
        let certificate_valid_untrusted_A: Certificate;
        let caCertificateBuf: Buffer;

        before(async () => {
            const optionsPKI2 = { location: path.join(testData.tmpFolder, "TEST_PKI2") };

            localCertificateManager = new CertificateManager(optionsPKI2);
            await localCertificateManager.initialize();

            caCertificateBuf = readCertificate(certificateAuthority.caCertificate);
            const status = await localCertificateManager.addIssuer(caCertificateBuf);
            status.should.eql("Good");

            const crl = await readCertificateRevocationList(certificateAuthority.revocationList);
            const status1 = await localCertificateManager.addRevocationList(crl);
            status1.should.eql("Good");

            // get certificate
            cert1 = readCertificate(certificate_out_of_date);
            cert2 = readCertificate(certificate_not_yet_active);
            cert3 = readCertificate(certificate_valid);
            certificate_valid_untrusted_A = readCertificate(certificate_valid_untrusted);

            await localCertificateManager.trustCertificate(cert3);
            await localCertificateManager.rejectCertificate(certificate_valid_untrusted_A);

        });

        it("should detect null certificate", async () => {
            const status = await localCertificateManager.verifyCertificate(null! as Buffer);
            status.toString().should.eql("BadSecurityChecksFailed");
        });

        it("should detect out of date certificate", async () => {
            const status = await localCertificateManager.verifyCertificate(cert1);
            status.toString().should.eql("BadCertificateTimeInvalid");
        });

        it("should detect 'not active yet' certificate", async () => {
            const status = await localCertificateManager.verifyCertificate(cert2);
            status.toString().should.eql("BadCertificateTimeInvalid");
        });

        it("should detect a valid certificate", async () => {
            const status = await localCertificateManager.verifyCertificate(cert3);
            status.toString().should.eql("Good");
        });

        it("should detect untrusted certificate", async () => {
            const status = await localCertificateManager.verifyCertificate(certificate_valid_untrusted_A);
            status.toString().should.eql("BadCertificateUntrusted");
        });

        it("should find issuer of certificate 1", async () => {
            const issuerCertificate = await localCertificateManager.findIssuerCertificate(cert1);
            if (!issuerCertificate) {
                throw new Error("Cannot find issuer certificate");
            }
            issuerCertificate!.toString("hex").should.eql(caCertificateBuf.toString("hex"));
        });

    });
});
