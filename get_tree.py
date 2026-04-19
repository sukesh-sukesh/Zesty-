import os

def generate_tree(dir_path, prefix="", ignore_dirs=None):
    if ignore_dirs is None:
        ignore_dirs = {'.git', 'node_modules', 'venv', '__pycache__', '.env', '.vscode', 'dist', 'build'}
    
    entries = os.listdir(dir_path)
    entries.sort(key=lambda x: (not os.path.isdir(os.path.join(dir_path, x)), x))
    
    entries = [e for e in entries if e not in ignore_dirs]
    
    tree_str = ""
    for i, entry in enumerate(entries):
        path = os.path.join(dir_path, entry)
        is_last = (i == len(entries) - 1)
        connector = "└── " if is_last else "├── "
        
        tree_str += prefix + connector + entry + "\n"
        
        if os.path.isdir(path):
            extension = "    " if is_last else "│   "
            tree_str += generate_tree(path, prefix=prefix + extension, ignore_dirs=ignore_dirs)
            
    return tree_str

if __name__ == "__main__":
    project_dir = r"d:\Projects\mini-s6"
    tree_output = "mini-s6\n" + generate_tree(project_dir)
    with open("tree_structure.txt", "w", encoding="utf-8") as f:
        f.write(tree_output)
