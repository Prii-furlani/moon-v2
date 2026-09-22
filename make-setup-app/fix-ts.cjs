const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace user property accesses with non-null assertion
content = content.replace(/user\.tenantId/g, 'user!.tenantId');
content = content.replace(/user\.name/g, 'user!.name');
content = content.replace(/user\.role/g, 'user!.role');
content = content.replace(/user\.themePreference/g, 'user!.themePreference');
content = content.replace(/user\.isFirstLogin/g, 'user!.isFirstLogin');

// Fix setUsers
content = content.replace(/setUser\(prev => \({/g, 'setUser(prev => prev ? ({');
content = content.replace(/setUser\(prev => prev \? \(\{ \.\.\.prev, \.\.\.updatedUser \}\)\);/g, 'setUser(prev => prev ? ({ ...prev, ...updatedUser }) : null);');
content = content.replace(/setUser\(prev => prev \? \(\{ \.\.\.prev, role: newRole \}\)\);/g, 'setUser(prev => prev ? ({ ...prev, role: newRole }) : null);');
content = content.replace(/setUser\(prev => prev \? \(\{ \.\.\.prev, \.\.\.loggedInUser \}\)\);/g, 'setUser(prev => prev ? ({ ...prev, ...loggedInUser }) : null);');
content = content.replace(/setUser\(u => \({/g, 'setUser(u => u ? ({');
content = content.replace(/setUser\(u => u \? \(\{ \.\.\.u, themePreference: nextTheme \? 'dark' : 'light' \}\)\);/g, "setUser(u => u ? ({ ...u, themePreference: nextTheme ? 'dark' : 'light' }) : null);");

// For block setUser
content = content.replace(/setUser\(prev => \{\n\s+const nextUser = \{ \.\.\.prev, \.\.\.updatedUser \};/g, 'setUser(prev => {\\n      if (!prev) return null;\\n      const nextUser = { ...prev, ...updatedUser };');

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx transformed');
