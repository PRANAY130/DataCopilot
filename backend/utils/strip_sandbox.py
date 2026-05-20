import re

file_path = r'd:\MY PROJECTS\ABB\frontend\src\app\results\[id]\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove states
content = re.sub(r'// Tab control.*?const \[activeTab, setActiveTab\] = useState.*?;\n', '', content, flags=re.DOTALL)
content = re.sub(r'// Individual sandbox states.*?const \[singleError, setSingleError\] = useState.*?;\n', '', content, flags=re.DOTALL)
content = re.sub(r'// Batch sandbox states.*?const \[dragging, setDragging\] = useState.*?;\n', '', content, flags=re.DOTALL)

# Remove sandbox derived values and useEffect
content = re.sub(r'// -- Sandbox derived values.*?}, \[session, activeColumns\.length\]\);\n', '', content, flags=re.DOTALL)

# Remove inference functions
content = re.sub(r'const runSingleInference = async.*?};\n\n  const runBatchInference = async.*?};\n\n  const handleDownload = \(\) => {.*?};\n', '', content, flags=re.DOTALL)

# Remove Tab Selector UI
content = re.sub(r'{\/\* Tab Selector \*\/}.*?<\/div>\n\n', '', content, flags=re.DOTALL)

# Remove the conditional wrapper around dashboard
content = content.replace('{activeTab === "dashboard" ? (\n          <div>\n', '<div>\n')

# Remove everything from the else branch until the end wrapper
# This matches from ') : (' down to ')}' just before '</div>\n    </main>'
content = re.sub(r'\) : \(\n          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:28,alignItems:"flex-start"}}>(.*?)          </div>\n        \)}', '', content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Cleanup script finished')
