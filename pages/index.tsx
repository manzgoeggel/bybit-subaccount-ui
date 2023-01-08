// import { ContractClient } from "bybit-api";

import { ContractClient, OrderSide } from "bybit-api";
import { useEffect, useMemo, useState } from "react";
import { useKeyPress } from "react-use";
import { v4 as uuidv4 } from "uuid";
import AssetTransferModal from "../components/account-transfer/AssetTransferModal";
import { Asset, Position, PositionTable } from "../components/PositionTable";
export enum AccountType {
	MAIN = "main",
	SUB = "sub",
}

export interface Account {
	[accountId: string]: {
		key: string;
		secret: string;
		type: AccountType;
	};
}

interface PerpClient {
	perpClient: ContractClient;
	id: string;
	type: AccountType;
}

interface ClientPositions {
	[key: string]: {
		positions: Position[];
	};
}

export interface ClientAssets {
	[key: string]: {
		assets: Asset[];
	};
}

export default function AccountDashboard() {
	const accounts: Account = useMemo(() => {
		return {
			"1139313": {
				key: "VGO4EhQVl6QKdR3ASz",
				secret: "xZ9nkI81I9uLqoHyKtoQckYxWO0YNYKA9lwl",
				type: AccountType.MAIN,
			},
			"1139316": {
				key: "VSCWAWNSXFGQIKKJMZ",
				secret: "LVFXFVRQQQTAAFWHSFOAEJRQKYYECFUADFPF",
				type: AccountType.SUB,
			},
			"1139320": {
				key: "CDFHLEYPHMHJHGCDQQ",
				secret: "KREGUSISSNHTNQAESTHDMRRHPIPTXZNVUIQJ",
				type: AccountType.SUB,
			},
		};
	}, []);

	const [perpClients, setPerpClients] = useState<PerpClient[]>([]);
	const [clientPositions, setClientPositions] = useState<ClientPositions>({});
	const [clientAssets, setClientAssets] = useState<ClientAssets>({});
	const [allAssets, setAllAssets] = useState<Asset[]>([]);
	const [openTransferModal, setOpenTransferModal] = useState(false);
	const isCmdKPressed = useKeyPress((e) => e.metaKey && e.key === "k");


	async function initiateClients(accounts: Account): Promise<PerpClient[]> {
		//initiate the client for each Account
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

	function filterDuplicateAssets(assets: Asset[]): Asset[] {
		const seenCoins = new Set();
		return assets.filter((asset) => {
			if (seenCoins.has(asset.coin)) {
				return false;
			} else {
				seenCoins.add(asset.coin);
				return true;
			}
		});
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

		return () => clearInterval(id);
	}, [perpClients]);

	//get all derivative assets over > 0, for each client
	useEffect(() => {
		(async () => {
			try {
				let clientAssets = {};
				let assets: Asset[] = [];
				for await (const client of Object.keys(perpClients)) {
					const { id, perpClient } = perpClients[client];

					const response = await perpClient.getBalances();

					if (response.result.list.length > 0) {
						const assets_ = response.result.list.filter((asset: Asset) => {
							if (Number(asset.equity) > 0) {
								return asset;
							}
						});
						clientAssets[id] = assets_;
						assets = [...assets, ...assets_];
					}
				}
				console.log("test", filterDuplicateAssets(assets));
				setAllAssets(filterDuplicateAssets(assets));
				setClientAssets(clientAssets);
			} catch (err) {
				console.log(err);
			}
		})();
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

	//IN = into main account from Account
	//OUT = into subaccoutn from main account
	async function transferAssetsInternally(amount: string, coin: string, fromAccountId: string, toAccountId: string) {
		try {
			const mainAccount = perpClients.find((client) => client.type === "main");
			if (mainAccount === undefined) {
				return;
			}
			const [fromAccountType, toAccountType] = [accounts[fromAccountId].type, accounts[toAccountId].type];

			//if sub to sub, to an extra transfer to the main account first (as direct sub to sub transfers are not supported)
			if (fromAccountType === AccountType.SUB && toAccountType === AccountType.SUB) {
				const mainAccountTransfer = await mainAccount.perpClient.postPrivate("/asset/v3/private/transfer/universal-transfer", {
					transferId: uuidv4(),
					coin,
					amount,
					fromMemberId: fromAccountId,
					toMemberId: mainAccount.id,
					fromAccountType: "CONTRACT",
					toAccountType: "CONTRACT",
				});

				if (mainAccountTransfer.retMsg === "OK") {
					const subAccountTransfer = await mainAccount.perpClient.postPrivate("/asset/v3/private/transfer/universal-transfer", {
						transferId: uuidv4(),
						coin,
						amount,
						fromMemberId: mainAccount.id,
						toMemberId: toAccountId,
						fromAccountType: "CONTRACT",
						toAccountType: "CONTRACT",
					});

					if (subAccountTransfer.retMsg === "OK") {
						const clients = await initiateClients(accounts);

						setPerpClients(clients);
						console.log("TRANSFER!🎉", subAccountTransfer);
					}
				}
			} else {
				const transfer = await mainAccount.perpClient.postPrivate("/asset/v3/private/transfer/universal-transfer", {
					transferId: uuidv4(),
					coin,
					amount,
					fromMemberId: fromAccountId,
					toMemberId: toAccountId,
					fromAccountType: "CONTRACT",
					toAccountType: "CONTRACT",
				});

				if (transfer.retMsg === "OK") {
					const clients = await initiateClients(accounts);

					setPerpClients(clients);
				}

				console.log("TRANSFER!🎉", transfer);
			}
		} catch (err) {
			console.log(err);
		}
	}
	useEffect(() => {
		if (isCmdKPressed[0]) {
			if (!openTransferModal) {
				setOpenTransferModal(true);
			} else {
				setOpenTransferModal(false);
			}
		}
	}, [isCmdKPressed]);
	return (
		<div className="h-screen w-screen bg-gray-50 flex flex-col justify-center">
			<AssetTransferModal
				accounts={accounts}
				clientAssets={clientAssets}
				allAssets={allAssets}
				transferAssetsInternally={transferAssetsInternally}
				open={openTransferModal}
				setOpen={setOpenTransferModal}
			/>
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
						/>
					))}
			</div>
		</div>
	);
}
