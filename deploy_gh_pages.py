import os
import subprocess
import shutil
import sys

def deploy():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(base_dir, "frontend")
    dist_dir = os.path.join(frontend_dir, "dist")
    
    # 1. Check if git remote is set
    try:
        remote_url = subprocess.check_output("git remote get-url origin", shell=True, cwd=base_dir).decode("utf-8").strip()
        print(f"Detected remote origin: {remote_url}")
    except Exception:
        print("\n[Action Required] No git remote origin detected!")
        print("Please link your local repository to GitHub first by running:")
        print("  git remote add origin <your-github-repo-url>")
        print("  git push -u origin master")
        print("\nOnce origin is added, run this deploy script again to publish live.")
        return False

    # 2. Run build in frontend
    print("\nBuilding frontend app...")
    try:
        subprocess.check_call("npm run build", shell=True, cwd=frontend_dir)
    except Exception as e:
        print(f"Error compiling Vite app: {e}")
        return False
        
    # 3. Create temp git repo in dist
    print("\nPreparing dist folder for GitHub Pages deployment...")
    git_dist_dir = os.path.join(dist_dir, ".git")
    if os.path.exists(git_dist_dir):
        try:
            shutil.rmtree(git_dist_dir)
        except Exception:
            # Try running command line if permission error
            subprocess.call(f'rmdir /s /q "{git_dist_dir}"', shell=True)
        
    try:
        subprocess.check_call("git init", shell=True, cwd=dist_dir)
        subprocess.check_call("git checkout -b gh-pages", shell=True, cwd=dist_dir)
        subprocess.check_call("git add .", shell=True, cwd=dist_dir)
        subprocess.check_call('git commit -m "Deploy to GitHub Pages"', shell=True, cwd=dist_dir)
        subprocess.check_call(f"git remote add origin {remote_url}", shell=True, cwd=dist_dir)
    except Exception as e:
        print(f"Error configuring temporary git repo in dist: {e}")
        return False
    
    # 4. Push to gh-pages branch
    print(f"\nPushing to gh-pages branch on remote: {remote_url}...")
    try:
        subprocess.check_call("git push -f origin gh-pages", shell=True, cwd=dist_dir)
    except Exception as e:
        print(f"Error pushing to GitHub: {e}")
        print("Please check your GitHub permissions or try pushing manually from the frontend/dist folder.")
        return False
        
    print("\n==========================================")
    print("Deployment completed successfully!")
    print("Your dashboard will be live shortly on GitHub Pages!")
    print("==========================================")
    return True

if __name__ == "__main__":
    deploy()
