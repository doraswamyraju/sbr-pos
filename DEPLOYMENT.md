# Sri Balaji Renewables POS - VPS Deployment Guide

This guide details how to locate the project directory on the VPS and deploy updates safely.

## 1. Locate the Project Directory on the VPS

If you are not sure where the project files are stored on the server, you can find them using the following methods.

### Method A: Search Nginx Configuration (Recommended)
Since the app is hosted at `https://pos.sriddha.com`, Nginx is routing the traffic. Run the following command to find the config file and the root directory where the application is served:
```bash
grep -r "pos.sriddha.com" /etc/nginx/
```
Look for the `root` directive inside the returned configuration block. For example:
```nginx
root /var/www/rajugariventures/sbr-pos/build;
```
The project root directory is `/var/www/rajugariventures/sbr-pos`.

### Method B: Find git repositories on the server
Search the VPS filesystem for directories named `sbr-pos` or directories containing a `.git` folder:
```bash
find /var/www /home /root -name "sbr-pos" -type d 2>/dev/null
# or find any git repo
find /var/www /home /root -name ".git" -type d 2>/dev/null
```

---

## 2. Deploying Updates

Run these commands on your VPS:

```bash
# 1. Navigate to the project directory
cd /var/www/rajugariventures/sbr-pos

# 2. Pull the latest changes from Git
git pull origin main

# 3. Install dependencies (using legacy-peer-deps to handle React peer conflicts)
npm install --legacy-peer-deps

# 4. Build the production application
npm run build
```

---

## 3. Troubleshooting Common Errors

### Error: `fatal: not a git repository`
* **Reason:** You ran the command in the wrong folder (like `/root` or `/`).
* **Fix:** Ensure you `cd` into the correct project folder containing the `.git` folder before running `git pull`.

### Error: `npm error Missing script: "build"`
* **Reason:** You ran `npm run build` in a folder that doesn't contain the React project (no `package.json` with a build script).
* **Fix:** Navigate to the folder containing `package.json` before running the command.
