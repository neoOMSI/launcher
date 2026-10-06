# neoOMSI Launcher

Desktop launcher for the neoOMSI simulator built with Electron and React.

The launcher runs as an external client process and communicates with the neoOMSI engine over standard input and output (`stdin` / `stdout`) using length-prefixed protocol frames.

## Technology Stack

- Electron 44
- React 19
- TypeScript 7 (strict mode)
- Vite 8
- Vitest 5
- pnpm

## Development

Install dependencies:

```bash
pnpm install
```

Run test suite:

```bash
pnpm test
```

Type-check and build:

```bash
pnpm build
```

Start development application (with hot reload; defaults to mock engine fixture):

```bash
pnpm dev:app
```

> Note: Vite hot reload applies to the React renderer. Changes to Electron main or preload require restarting `pnpm dev:app`.

Run production build against a real engine:

```bash
NEOOMSI_ENGINE_PATH=/path/to/neoomsi pnpm start
```

Run production build with explicit mock fixture:

```bash
NEOOMSI_USE_MOCK=1 pnpm start
```

## License and Trademarks

neoOMSI Launcher is open-source software licensed under the GNU General Public License v3.0 or later. See [LICENSE](LICENSE) for details.

The project name **neoOMSI**, logos, and icons are proprietary brand assets. See [TRADEMARKS.md](TRADEMARKS.md) for usage policies and guidelines on redistribution.

"OMSI", "OMSI 2", and related designations are trademarks or trade names of their respective owners. neoOMSI is an independent project and is neither affiliated with nor endorsed by the creators, developers, or publishers of OMSI.
