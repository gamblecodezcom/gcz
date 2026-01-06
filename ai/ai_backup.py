import os, tarfile, time, logging, shutil

ROOT="/var/www/html/gcz"
BACKUP_DIR=f"{ROOT}/_auto_backups"
LOG=f"{ROOT}/logs/ai_backup.log"
EXCLUDE=["node_modules",".git","__pycache__","_auto_backups","logs"]
MAX_GB=10

logging.basicConfig(filename=LOG, level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
os.makedirs(BACKUP_DIR,exist_ok=True)

def dir_size_gb(p):
    return sum(os.path.getsize(os.path.join(d,f)) for d,_,fs in os.walk(p) for f in fs)/1024/1024/1024

def rotate():
    files=sorted([os.path.join(BACKUP_DIR,f) for f in os.listdir(BACKUP_DIR)],key=os.path.getmtime)
    while dir_size_gb(BACKUP_DIR)>MAX_GB and files:
        os.remove(files.pop(0))

def create():
    stamp=time.strftime("%Y%m%d_%H%M%S")
    path=f"{BACKUP_DIR}/gcz_{stamp}.tar.gz"
    with tarfile.open(path,"w:gz") as tar:
        def skip(p): return any(x in p for x in EXCLUDE)
        for root,dirs,files in os.walk(ROOT):
            dirs[:]=[d for d in dirs if not skip(d)]
            for file in files:
                full=os.path.join(root,file)
                if not skip(full):
                    tar.add(full,arcname=os.path.relpath(full,ROOT))
    logging.info(f"Backup created {path}")

if __name__=="__main__":
    rotate()
    create()
    rotate()
    logging.info("Backup complete")
