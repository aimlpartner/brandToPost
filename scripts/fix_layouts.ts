import fs from 'fs';

// --- Fix Settings.tsx ---
let settingsContent = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

// 1. Change max-w-3xl to w-full max-w-5xl
settingsContent = settingsContent.replace(
  'className="space-y-8 max-w-3xl animate-in fade-in duration-500"',
  'className="space-y-8 w-full max-w-6xl animate-in fade-in duration-500"'
);

// 2. Add grid to integrations
settingsContent = settingsContent.replace(
  `          <p className="mt-1 text-sm text-gray-300 mb-6">
            Connect your social accounts to publish campaigns directly.
          </p>
          
          <div className="glass-card`,
  `          <p className="mt-1 text-sm text-gray-300 mb-6">
            Connect your social accounts to publish campaigns directly.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card`
);

// 3. Close the grid and remove top margins from cards
settingsContent = settingsContent.replace(
  `              </ul>
            </div>
          )}
        </div>
      </div>`,
  `              </ul>
            </div>
          )}
        </div>
          </div>
      </div>`
);

settingsContent = settingsContent.replace(
  /className="glass-card p-4 sm:p-5 flex flex-col gap-4 mt-4"/g,
  'className="glass-card p-4 sm:p-5 flex flex-col gap-4"'
);

settingsContent = settingsContent.replace(
  /className="glass-card p-4 sm:p-5 flex flex-col gap-4"/g,
  'className="glass-card p-4 sm:p-5 flex flex-col gap-4 w-full"'
);

fs.writeFileSync('src/pages/Settings.tsx', settingsContent);

// --- Fix Schedule.tsx ---
let scheduleContent = fs.readFileSync('src/pages/Schedule.tsx', 'utf-8');

scheduleContent = scheduleContent.replace(
  'className="space-y-8 max-w-4xl animate-in fade-in duration-500"',
  'className="space-y-8 w-full max-w-screen-2xl animate-in fade-in duration-500"'
);

scheduleContent = scheduleContent.replace(
  'className="grid grid-cols-1 md:grid-cols-3 gap-6"',
  'className="grid grid-cols-1 xl:grid-cols-4 gap-8"'
);

scheduleContent = scheduleContent.replace(
  'className="md:col-span-2 space-y-4"',
  'className="xl:col-span-3 space-y-4"'
);

fs.writeFileSync('src/pages/Schedule.tsx', scheduleContent);
console.log("Layout adjustments complete.");
