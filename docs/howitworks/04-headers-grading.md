# Security Analysis Grading

## HTTP Header Grading Rules

```mermaid
flowchart LR
    classDef good fill:#0a6640,color:#ffffff,stroke:#0a6640
    classDef weak fill:#8a6d00,color:#ffffff,stroke:#8a6d00
    classDef missing fill:#5c1a1a,color:#ffffff,stroke:#5c1a1a
    classDef header fill:#1a3a5c,color:#ffffff,stroke:#1a3a5c
    classDef info fill:#3a1a5c,color:#ffffff,stroke:#3a1a5c

    HSTS["Strict-Transport-Security"]:::header
    HSTS_G["GOOD<br/>max-age ≥ 1yr +<br/>includeSubDomains"]:::good
    HSTS_W["WEAK<br/>max-age < 1yr or<br/>missing includeSubDomains"]:::weak
    HSTS_M["MISSING"]:::missing
    HSTS --> HSTS_G & HSTS_W & HSTS_M

    CSP["Content-Security-Policy"]:::header
    CSP_G["GOOD<br/>no unsafe directives"]:::good
    CSP_W["WEAK<br/>unsafe-inline or<br/>unsafe-eval present"]:::weak
    CSP_M["MISSING"]:::missing
    CSP --> CSP_G & CSP_W & CSP_M

    XCTO["X-Content-Type-Options"]:::header
    XCTO_G["GOOD<br/>nosniff"]:::good
    XCTO_W["WEAK<br/>unexpected value"]:::weak
    XCTO_M["MISSING"]:::missing
    XCTO --> XCTO_G & XCTO_W & XCTO_M

    XFO["X-Frame-Options"]:::header
    XFO_G["GOOD<br/>DENY or SAMEORIGIN"]:::good
    XFO_W["WEAK<br/>ALLOW-FROM or other"]:::weak
    XFO_M["MISSING"]:::missing
    XFO --> XFO_G & XFO_W & XFO_M

    RP["Referrer-Policy"]:::header
    RP_G["GOOD<br/>any value except unsafe-url"]:::good
    RP_W["WEAK<br/>unsafe-url"]:::weak
    RP_M["MISSING"]:::missing
    RP --> RP_G & RP_W & RP_M

    PP["Permissions-Policy"]:::header
    PP_G["GOOD<br/>present"]:::good
    PP_M["MISSING"]:::missing
    PP --> PP_G & PP_M

    LEAK["Info Leakage Detection"]:::info
    LEAK --> SRV["Server: Apache/2.4.51"]:::weak
    LEAK --> PWR["X-Powered-By: PHP/8.1"]:::weak
```

## Additional HTTP Checks

Beyond header grading, the HTTP scan also analyzes:

- **Cookies** — Checks each Set-Cookie for Secure, HttpOnly, and SameSite attributes
- **External Scripts** — Identifies scripts missing Subresource Integrity (SRI) hashes
- **CORS** — Tests for wildcard origins, origin reflection, and credential misconfiguration
- **Technology Detection** — Identifies frameworks and CMS platforms from meta tags and headers

## TLS Grading Rules

```mermaid
flowchart LR
    classDef good fill:#0a6640,color:#ffffff,stroke:#0a6640
    classDef weak fill:#8a6d00,color:#ffffff,stroke:#8a6d00
    classDef missing fill:#5c1a1a,color:#ffffff,stroke:#5c1a1a
    classDef header fill:#1a3a5c,color:#ffffff,stroke:#1a3a5c

    subgraph Protocols
        TLS13["TLS 1.3"]:::header
        TLS13_G["GOOD<br/>supported"]:::good
        TLS13_M["MISSING<br/>recommended but<br/>not supported"]:::missing
        TLS13 --> TLS13_G & TLS13_M

        TLS12["TLS 1.2"]:::header
        TLS12_G["GOOD<br/>supported"]:::good
        TLS12_M["MISSING<br/>recommended but<br/>not supported"]:::missing
        TLS12 --> TLS12_G & TLS12_M

        TLS11["TLS 1.1"]:::header
        TLS11_W["WEAK<br/>deprecated, should<br/>be disabled"]:::weak
        TLS11_G["GOOD<br/>correctly disabled"]:::good
        TLS11 --> TLS11_W & TLS11_G

        TLS10["TLS 1.0"]:::header
        TLS10_W["WEAK<br/>deprecated, should<br/>be disabled"]:::weak
        TLS10_G["GOOD<br/>correctly disabled"]:::good
        TLS10 --> TLS10_W & TLS10_G
    end

    subgraph Ciphers
        CIPHER["Cipher Suite"]:::header
        C_G["GOOD<br/>strong cipher +<br/>forward secrecy"]:::good
        C_W["WEAK<br/>no forward secrecy"]:::weak
        C_M["MISSING<br/>weak cipher<br/>(RC4, DES, etc.)"]:::missing
        CIPHER --> C_G & C_W & C_M
    end

    subgraph Certificate
        CERT["Certificate"]:::header
        CERT_OK["Valid, trusted,<br/>hostname matches"]:::good
        CERT_EXP["Expired or<br/>expiring soon"]:::weak
        CERT_BAD["Self-signed or<br/>hostname mismatch"]:::missing
        CERT --> CERT_OK & CERT_EXP & CERT_BAD
    end
```
