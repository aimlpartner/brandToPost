import fs from 'fs';

let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const tableUI = `
        {/* Cost Breakdown Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-[#7C3AED]/20">
            <h3 className="text-lg font-semibold text-white">Cost Analysis per Operation</h3>
            <p className="text-sm text-gray-400 mt-1">Average and total costs based on API usage.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#7C3AED]/20">
              <thead className="bg-[#1C1C22]/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Operation Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Times Run</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Cost (USD)</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Cost (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#7C3AED]/10 bg-[#1C1C22]/30">
                {costBreakdownData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#1C1C22]/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                      {row.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {row.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      \${row.averageCost < 0.0001 ? "0.0001>" : row.averageCost.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#18F07A]">
                      \${row.totalCost.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
`;

// Insert the table just before the "Recent API Logs" table
content = content.replace(
  /<div className="glass-card overflow-hidden">\s*<div className="p-6 border-b border-\[\#7C3AED\]\/20">/,
  tableUI + '\n          <div className="p-6 border-b border-[#7C3AED]/20">'
);

// We should also change models chart to show Cost by Model instead of Tokens by Model
content = content.replace(
  /<h3 className="text-lg font-semibold text-white mb-6">Tokens by Model<\/h3>/,
  '<h3 className="text-lg font-semibold text-white mb-6">Cost by Model (USD)</h3>'
);
content = content.replace(
  /label=\{\(\{name, percent\}\) => \`\$\{name\} \$\{\(percent \* 100\)\.toFixed\(0\)\}\%\`\}/,
  `label={({name, percent}) => \`\${name.replace('gemini-','')} (\${(percent * 100).toFixed(0)}%)\`}`
);


fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
