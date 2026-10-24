from app.services.complaint import BLANK, _clean, _val, _when


def build_section63(d: dict) -> dict:
    entries = sorted(d["entries"], key=lambda e: e["seq"])

    L: list[str] = [
        "Section 63(4) BSA certificate - Part A information sheet",
        "This is a worksheet. Copy these answers into the certificate form given in the "
        "Schedule to the Bharatiya Sakshya Adhiniyam, 2023. Part A is signed by the person "
        "producing the records. Part B must be completed by an expert.",
        "",
        "1. Declarant",
        f"Name: {_val(d.get('declarant_name'))}",
        f"Son / daughter / spouse of: {_val(d.get('relative_name'))}",
        f"Address: {_val(d.get('address'))}",
        f"Capacity in which this is given: {_val(d.get('capacity'))}",
        "",
        "2. Device or source the records were taken from",
        f"Type: {d['device_kind']}",
        f"Make and model: {_val(d.get('make_model'))}",
        f"Serial number / IMEI: {_val(d.get('serial_or_imei'))}",
        f"Owner of the device: {_val(d.get('device_owner'))}",
        "",
        "3. Records and hash values",
        f"{len(entries)} electronic record(s). Hash function used: SHA-256.",
    ]
    for e in entries:
        L += [
            f"No. {e['seq']}",
            f"  Item: {_clean(e.get('label')) or 'Saved item'}",
            f"  Saved at: {_when(e['captured_at'])}",
            f"  Hash value (SHA-256): {e['file_sha256']}",
            "",
        ]

    L += [
        "4. How the hash values were produced",
        "Each file's SHA-256 value was computed on the device from the original file when it "
        "was saved to the Aashray vault. The same value can be recomputed from the original "
        "file with any SHA-256 tool.",
        "",
        "5. Signature",
        f"Place: {_val(d.get('place'))}",
        "Signature: ______________________",
        "",
        "Part B (expert)",
        "To be completed and signed by an expert. Aashray cannot complete this part.",
        "",
        "Draft prepared with Aashray from the declarant's own information. It is not legal advice.",
    ]
    text = "\n".join(L)
    return {
        "text": text,
        "blanks": text.count(BLANK),
        "notes": [
            "Copy these answers into the official certificate form in the Schedule to the BSA, 2023.",
            "Part B must be completed and signed by an expert. Aashray cannot do this part.",
            "Check the hashes yourself. Windows: certutil -hashfile <file> SHA256. macOS: shasum -a 256 <file>.",
            "Have a lawyer review the certificate before it is filed.",
        ],
    }