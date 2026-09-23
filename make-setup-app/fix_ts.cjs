const fs = require('fs');

let c = fs.readFileSync('src/App.tsx', 'utf8');

// Fix unused Skeleton import
c = c.replace(/import \{ Skeleton, CardSkeleton, TableSkeleton \} from '\.\/components\/ui\/skeleton';/, "import { CardSkeleton, TableSkeleton } from './components/ui/skeleton';");

// Fix missing timestamp in AuditLog
c = c.replace(/ip: '189\.121\.44\.10'\n\s*\};/g, "ip: '189.121.44.10',\n      timestamp: formattedDate\n    };");

// Fix missing descricao in Lancamento and DespesaMensal payloads
// Matches payload starts like `const novoLancamento: Lancamento = {`
// or `{ id: ..., categoria: 'Pets', ... }`
// Actually let's just do a blanket regex to add `descricao: "Auto gerado",` inside if missing.
c = c.replace(/(id: `(?:lan_emerg_|desp_emerg_|lan_|desp_ag_|desp_compra_)[^`]+`,)(\s+categoria:)/g, '$1 descricao: "Lançamento Automático", $2');

// Fix TableSkeleton type error (doesn't accept rows prop)
c = c.replace(/<TableSkeleton rows=\{4\} \/>/g, '<TableSkeleton />');

fs.writeFileSync('src/App.tsx', c);

// Fix SaaSAdminMasterView
let s = fs.readFileSync('src/components/SaaSAdminMasterView.tsx', 'utf8');
// Replace `const [tenants, setTenants] = useState([]);` with `const [tenants, setTenants] = useState<any[]>([]);`
s = s.replace(/useState\(\[\]\);/g, 'useState<any[]>([]);');
fs.writeFileSync('src/components/SaaSAdminMasterView.tsx', s);

console.log('Fixed TS errors');
