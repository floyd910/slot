# Double exit settlement

Confirmed Double winnings are collected via /pay before in-app navigation, host close or host-requested reload. Success applies the authoritative balance, clears the active Double round and stores the last grid as paid. A rejected/failed payment blocks in-app navigation and retains the payment obligation without a resumable Double UI.

pagehide uses the same payment path with fetch keepalive. It does not use visibilitychange: switching tabs is not an exit. React effect cleanup does not pay. Concurrent exit requests share one promise. A pending or unknown operation prevents payment and remains available for reconciliation.

Browser/process termination cannot guarantee delivery or receipt of /pay, even with keepalive. Full settlement guarantees require backend handling of abandoned confirmed rounds and an authoritative operation-status/idempotent reconciliation contract. An /init last-card snapshot alone does not resolve a specific pending Double or payment. Until that contract exists, unknown requests remain blocked; the client never invents a result or blindly retries payment.
