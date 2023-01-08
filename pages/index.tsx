// import { ContractClient } from "bybit-api";

import { ContractClient, OrderSide } from "bybit-api";
import { useEffect, useMemo, useState } from "react";
import { Position, PositionTable } from "../components/PositionTable";

interface SubAccount {
	[key: string]: {
		key: string;
		secret: string;
	};
}

interface PerpClient {
	perpClient: ContractClient;
	id: string;
}

interface ClientPositions {
	[key: string]: {
		positions: Position[];
	};
}

export default function SubAccountDashboard() {
	const subAccounts = useMemo(() => {
		return {
			"1139316": {
				key: "VSCWAWNSXFGQIKKJMZ",
				secret: "LVFXFVRQQQTAAFWHSFOAEJRQKYYECFUADFPF",
			},
			"1139320": {
				key: "CDFHLEYPHMHJHGCDQQ",
				secret: "KREGUSISSNHTNQAESTHDMRRHPIPTXZNVUIQJ",
			},
		};
	}, []);

	const [perpClients, setPerpClients] = useState<PerpClient[]>([]);
	const [clientPositions, setClientPositions] = useState<ClientPositions>({});

	async function initiateClients(subAccounts: SubAccount): Promise<PerpClient[]> {
		//initiate the client for each subaccount
		const clients: PerpClient[] = [];
		Object.keys(subAccounts).forEach((i) => {
			const perpClient = new ContractClient({
				key: subAccounts[i].key,
				secret: subAccounts[i].secret,
				strict_param_validation: true,
				testnet: true,
			});
			clients.push({ perpClient, id: i });
		});
		return clients;
	}

	async function getAllPositions(clients: PerpClient[]): Promise<ClientPositions> {
		const clientPositions: ClientPositions = {};
		for await (const client of clients) {
			const positions = await client.perpClient.getPositions({
				settleCoin: "USDT",
			});
			clientPositions[client.id] = { positions: positions.result.list };
		}
		return clientPositions;
	}

	useEffect(() => {
		(async () => {
			try {
				const clients = await initiateClients(subAccounts);

				setPerpClients(clients);
			} catch (err) {
				console.log(err);
			}
		})();
	}, [subAccounts]);

	useEffect(() => {
		const id = setInterval(async () => {
			const positions = await getAllPositions(perpClients);
			setClientPositions(positions);
		}, 500);

		// fetchData(); // <-- (2) invoke on mount

		return () => clearInterval(id);
	}, [perpClients]);

	async function closePosition(client: ContractClient, symbol: string, side: OrderSide, qty: string): Promise<void> {
      await client.submitOrder({
			symbol,
			side,
			orderType: "Market",
			qty,
			timeInForce: "FillOrKill",
		});
	}

	return (
		<div className="h-screen w-screen bg-gray-50 flex flex-col justify-center">
			<div className="mx-auto max-w-7xl sm:px-6 lg:px-8 bg-white w-full py-10 space-y-5">
				{Object.keys(clientPositions).length > 0 &&
					perpClients.map((account, index) => (
						<PositionTable
							key={account.id}
							subAccountId={account.id}
							positions={clientPositions[account.id].positions}
							colorIndex={index}
							client={account.perpClient}
							closePosition={closePosition}
						/>
					))}
			</div>
		</div>
	);
}
