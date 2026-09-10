# Trainex Operations Runbook & SRE Guide
**Target Audience:** DevOps Engineers, Cloud SREs, and Autonomous Coding Agents  
**Workspace:** `/Users/nitinagga/Documents/trainex`

---

## 1. Initial Chrome Session Seeding (Day 0)

To eliminate Google Identity bot-detection checkpoints, session profiles must be seeded interactively on an authenticated Linux bastion inside the VPC. **Never seed sessions on a personal macOS laptop.**

### Step-by-Step Procedure:
1. Spin up the dedicated Linux headful bastion in the private VPC subnet:
   ```bash
   gcloud compute instances create trainex-session-bastion \
     --zone=us-central1-a \
     --network=trainex-prod-vpc \
     --subnet=trainex-private-subnet \
     --machine-type=e2-standard-4 \
     --image-family=ubuntu-2404-lts \
     --image-project=ubuntu-os-cloud
   ```
2. Connect via SSH with X11 forwarding or remote Chrome DevTools debugging:
   ```bash
   gcloud compute ssh trainex-session-bastion -- -L 9222:localhost:9222
   ```
3. Launch Google Chrome with the designated training service account:
   ```bash
   google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/trainex-seed-profile
   ```
4. Log into `https://console.cloud.google.com` interactively, complete 2FA, dismiss all introductory tours, and select the default Google Cloud project.
5. Package and encrypt the profile using Google Cloud KMS:
   ```bash
   tar -czf /tmp/profile.tar.gz -C /tmp/trainex-seed-profile .
   gcloud kms encrypt \
     --location=global \
     --keyring=trainex-vault \
     --key=session-encryption-key \
     --plaintext-file=/tmp/profile.tar.gz \
     --ciphertext-file=/tmp/profile.tar.gz.enc
   gsutil cp /tmp/profile.tar.gz.enc gs://trainex-session-vault/sessions/linux-session-v1.tar.gz.enc
   ```

---

## 2. Running the Rehearsal Matrix

Before any trace can be recorded for final video delivery, it must pass the **3x Rehearsal Matrix** against a freshly reset sandbox.

```bash
# Run rehearsal locally or in Cloud Run
node scripts/run_rehearsal.js \
  --trace=traces/vertex_deploy_v2.json \
  --runs=3 \
  --project-pool=trainex-ephemeral \
  --auto-heal=true
```

### Triaging a Rehearsal Flake:
If Run #2 or #3 flakes on a step:
1. Inspect the captured failure screenshot in `scratch/rehearsals/flake_step_X.png`.
2. Inspect the DOM snapshot in `scratch/rehearsals/flake_dom_X.html`.
3. Invoke the autonomous flake healer subagent:
   ```bash
   node scripts/run_skill.js rehearsal-flake-healer \
     --screenshot=scratch/rehearsals/flake_step_X.png \
     --dom=scratch/rehearsals/flake_dom_X.html \
     --target-action="Deploy Model"
   ```
4. Verify the updated `trace.v2.json` and rerun the 3x rehearsal matrix.

---

## 3. Incident Response & Playbooks

### Incident A: `AUTH_SESSION_EXPIRED` (HTTP 302 Redirect to Accounts Login)
* **Symptom:** Pre-flight probe or replay runner encounters `accounts.google.com/signin`.
* **Action:**
  1. Check if the weekly refresh cron failed in Cloud Monitoring.
  2. Execute the background token refresh script:
     ```bash
     node scripts/refresh_session_tokens.js --vault-uri=gs://trainex-session-vault/sessions/linux-session-v1.tar.gz.enc
     ```
  3. If refresh token is revoked, re-run Section 1 (Interactive Seeding).

### Incident B: `PII_LEAK_DETECTED` (Unmasked Billing ID or LDAP)
* **Symptom:** Gate 5 or Gate 6 fails the build with an unmasked email or account number.
* **Action:**
  1. Inspect the OCR error log: `grep -i "detected_pii" scratch/logs/screening_eval.json`.
  2. Extract the bounding box coordinates of the leak.
  3. Add the target element selector to `manifest.json` under `redaction_targets`:
     ```json
     "redaction_targets": [
       { "selector": ".billing-account-display", "mask_type": "gaussian_blur" }
     ]
     ```
  4. Re-run Remotion mastering (`npm run render`).

### Incident C: `GPU_RENDER_TIMEOUT` (Cloud Run NVIDIA L4 Memory OOM)
* **Symptom:** Remotion GPU worker exits with code `137` (Out of Memory).
* **Action:**
  1. Reduce Remotion parallel chunk rendering from `concurrency: 4` to `concurrency: 2`.
  2. Increase container shared memory `/dev/shm` to `8Gi`.
  3. Split the offending segment into two sub-segments.

---

## 4. Deploying Services to Google Cloud

Deploy the complete microservice fleet using Terraform:
```bash
cd terraform/environments/prod
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```
