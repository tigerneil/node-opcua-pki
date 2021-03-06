### node-opcua-pki

[![Build Status](https://travis-ci.org/node-opcua/node-opcua-pki.png?branch=master)](https://travis-ci.org/node-opcua/node-opcua-pki)
[![Code Climate](https://codeclimate.com/github/node-opcua/node-opcua-pki/badges/gpa.svg)](https://codeclimate.com/github/node-opcua/node-opcua-pki)
[![Test Coverage](https://codeclimate.com/github/node-opcua/node-opcua-pki/badges/coverage.svg)](https://codeclimate.com/github/node-opcua/node-opcua-pki/coverage)

## Create a Certificate Authority

```
    PKI\CA                   Certificate Authority

    PKI\rejected             Certificates that are rejected - regardless of validity
    PKI\trusted
    PKI\issuers
    PKI\issuers\crl
    PKI\issuers\certs
```

# commands

| command     | Help                                            |
| ----------- | ----------------------------------------------- |
| demo        | create default certificate for node-opcua demos |
| createCA    | create a Certificate Authority                  |
| createPKI   | create a Public Key Infrastructure              |
| certificate | create a new certificate                        |
| revoke      | revoke a existing certificate                   |
| dump        | display a certificate                           |
| toder       | convert a certificate to a DER format           |
| fingerprint | print the certifcate fingerprint                |

Options:
--help display help


## create a certificate authority

|                                 |                                                      | default value      |
| ------------------------------- | ---------------------------------------------------- | ------------------ |
| `--subject`                     | the CA certificate subject                           | "/C=FR/ST=IDF/L=Paris/O=Local NODE-OPCUA Certificate Authority/CN=NodeOPCUA-CA" |
| `--root`, `-r`                  | the location of the Certificate folder               | "{CWD}/certificates" |
| ` --CAFolder`, `-c`             | the location of the Certificate Authority folder     | "{root}/CA"] |
 |`--keySize`, `-k`, `--keyLength`| the private key size in bits (1024|2048|3072|4096)   |  2048 |


## demo command

this command create a bunch of certificates with various characteristics for demo and testing purposes.

```
crypto_create_CA  demo [--dev] [--silent] [--clean]
```

Options:

|              |                                                                |                    |
| ------------ | -------------------------------------------------------------- | ------------------ |
| --help       | display help                                                   |                    |
| --dev        | create all sort of fancy certificates for dev testing purposes |                    |
| --clean      | Purge existing directory [use with care!]                      |                    |
| --silent, -s | minimize output                                                |                    |
| --root, -r   | the location of the Certificate folder                         | {CWD}/certificates |

Example:

```
$crypto_create_CA  demo --dev
```

##### certificate command

```
$crypto_create_CA certificate --help
```

Options:

|                      |                                                         |                                  |
| -------------------- | ------------------------------------------------------- | -------------------------------- |
| --help               | display help                                            |                                  |
| --applicationUri, -a | the application URI                                     | urn:{hostname}:Node-OPCUA-Server |
| --output, -o         | the name of the generated certificate                   | my_certificate.pem               |
| --selfSigned, -s     | if true, certificate will be self-signed                | false                            |
| --validity, -v       | the certificate validity in days                        |                                  |
| --silent, -s         | minimize output                                         |                                  |
| --root, -r           | the location of the Certificate folder                  | {CWD}/certificates               |
| --CAFolder, -c       | the location of the Certificate Authority folder        | {root}/CA                        |
| --PKIFolder, -p      | the location of the Public Key Infrastructure           | {root}/PKI                       |
| --privateKey, -p     | optional:the private key to use to generate certificate |                                  |

#### References

-   https://www.entrust.com/wp-content/uploads/2013/05/pathvalidation_wp.pdf
-   https://en.wikipedia.org/wiki/Certification_path_validation_algorithm
-   https://tools.ietf.org/html/rfc5280
