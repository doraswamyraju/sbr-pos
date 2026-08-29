# Sri Balaji Renewables POS - VPS Deployment Guide

This guide details the exact steps to deploy updates safely on the VPS server for `https://pos.sriddha.com`.

---

## 1. Quick Deployment Checklist

Whenever you push new changes to GitHub, connect to the VPS via SSH and run:

```bash
# 1. Navigate to the project directory
cd /var/www/rajugariventures/sbr-pos

# 2. Pull the latest code
git pull origin main

# 3. Install dependencies (required if package.json changed)
npm install --legacy-peer-deps

# 4. Build the production React frontend
npm run build

# 5. Restart PHP-FPM (CRITICAL: Clears bytecode OPcache when PHP files change)
systemctl restart php8.1-fpm
```

---

## 2. Server Configuration Summary

| Setting | Value |
|---|---|
| **Domain** | `https://pos.sriddha.com` |
| **Project Directory** | `/var/www/rajugariventures/sbr-pos` |
| **Git Remote** | `https://github.com/doraswamyraju/sbr-pos.git` |
| **Branch** | `main` |
| **PHP Version** | `php8.1-fpm` |
| **Nginx Site Config** | `/etc/nginx/sites-available/pos.sriddha.com` |

---

## 3. Verifying Health After Deployment

Run a quick test request from the VPS to verify the backend API responds with `HTTP 200`:

```bash
curl -i "https://pos.sriddha.com/server/api/products.php"
```

---

## 4. Troubleshooting & Common Pitfalls

### Issue A: PHP changes are not taking effect (Stale OPcache)
* **Cause**: `php8.1-fpm` caches compiled PHP bytecode in memory.
* **Fix**: Run `systemctl restart php8.1-fpm` after pulling any PHP file changes.

### Issue B: Git remote points to wrong repository (`rajugariventures.git` instead of `sbr-pos.git`)
* **Check**:
  ```bash
  git remote -v
  ```
* **Fix**:
  ```bash
  git remote set-url origin https://github.com/doraswamyraju/sbr-pos.git
  git fetch origin main
  git reset --hard origin/main
  ```

### Issue C: Checking Live Error Logs
To view live server errors when testing features:
```bash
tail -f /var/log/nginx/error.log
```
