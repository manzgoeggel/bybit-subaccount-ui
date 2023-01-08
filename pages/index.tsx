// import { ContractClient } from "bybit-api";

import { ContractClient, OrderSide } from "bybit-api";
import { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Position, PositionTable } from "../components/PositionTable";


export enum AccountType {
	MAIN = "main",
	SUB = "sub"
}


interface SubAccount {
	[accountId: string]: {
		key: string;
		secret: string;
		type: AccountType
	};
}

interface PerpClient {
	perpClient: ContractClient;
	id: string;
	type: AccountType
}

interface ClientPositions {
	[key: string]: {
		positions: Position[];
	};
}

export default function SubAccountDashboard() {
	const accounts = useMemo(() => {
		return {
			"1139313": {
				key: "VGO4EhQVl6QKdR3ASz",
				secret: "xZ9nkI81I9uLqoHyKtoQckYxWO0YNYKA9lwl",
				type: AccountType.MAIN
			},
			"1139316": {
				key: "VSCWAWNSXFGQIKKJMZ",
				secret: "LVFXFVRQQQTAAFWHSFOAEJRQKYYECFUADFPF",
				type: AccountType.SUB
			},
			"1139320": {
				key: "CDFHLEYPHMHJHGCDQQ",
				secret: "KREGUSISSNHTNQAESTHDMRRHPIPTXZNVUIQJ",
				type: AccountType.SUB
			},
		};
	}, []);

	const [perpClients, setPerpClients] = useState<PerpClient[]>([]);
	const [clientPositions, setClientPositions] = useState<ClientPositions>({});

	async function initiateClients(accounts: SubAccount): Promise<PerpClient[]> {
		//initiate the client for each subaccount
		const clients: PerpClient[] = [];
		Object.keys(accounts).forEach((i) => {
			const perpClient = new ContractClient({
				key: accounts[i].key,
				secret: accounts[i].secret,
				strict_param_validation: true,
				testnet: true,
			});
			clients.push({ perpClient, id: i, type: accounts[i].type });
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
				const clients = await initiateClients(accounts);

				setPerpClients(clients);
			} catch (err) {
				console.log(err);
			}
		})();
	}, [accounts]);

	useEffect(() => {
		const id = setInterval(async () => {
			const positions = await getAllPositions(perpClients);
			setClientPositions(positions);
		}, 1000);

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

	//IN = into main account from subaccount
	//OUT = into subaccoutn from main account
	async function transferAssetsInternally(amount: string, coin: string, subAccountId: string, direction: "IN" | "OUT") {
		const mainAccount = perpClients.find((client) => client.type === "main");
		if (mainAccount === undefined) {
			return;
		}

		const transfer = await mainAccount.perpClient.postPrivate("/asset/v3/private/transfer/universal-transfer", {
			transferId: uuidv4(),
			coin,
			amount,
			fromMemberId: direction === "IN" ? subAccountId : mainAccount.id,
			toMemberId: direction === "IN" ? mainAccount.id : subAccountId,
			fromAccountType: "CONTRACT",
			toAccountType: "CONTRACT",
		});

		if (transfer.retMsg === "OK") {
			const clients = await initiateClients(accounts);

			setPerpClients(clients);
		}
		console.log("TRANSFER!🎉", transfer);
	}

	return (
		<div className="h-screen w-screen bg-gray-50 flex flex-col justify-center">
			<div className="mx-auto max-w-7xl sm:px-6 lg:px-8 bg-white w-full py-10 space-y-5">
				{Object.keys(clientPositions).length > 0 &&
					perpClients.map((account, index) => (
						<PositionTable
							key={account.id}
							accountId={account.id}
							positions={clientPositions[account.id].positions}
							colorIndex={index}
							client={account.perpClient}
							closePosition={closePosition}
							type={account.type}
							transferAssetsInternally={transferAssetsInternally}
						/>
					))}
			</div>
		</div>
	);
}
