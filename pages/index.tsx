import { ContractClient, OrderSide, WebsocketClient, DefaultLogger } from "bybit-api";
import { useEffect, useState } from "react";
import { useKeyPress, useLocalStorage } from "react-use";
import { v4 as uuidv4 } from "uuid";
import AssetTransferModal from "../components/account-transfer/AssetTransferModal";
import DropZoneModal from "../components/DropZone";
import { Asset, Position, PositionTable } from "../components/PositionTable";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
	const [perpClients, setPerpClients] = useState<PerpClient[]>([]);
	const [clientPositions, setClientPositions] = useState<ClientPositions>({});
	const [clientAssets, setClientAssets] = useState<ClientAssets>({});
	const [allAssets, setAllAssets] = useState<Asset[]>([]);
	const [openTransferModal, setOpenTransferModal] = useState(false);
	const isCmdKPressed = useKeyPress((e) => e.metaKey && e.key === "k");

	// const [accounts, setAccounts] = useState<Account>({});
	const [accounts, setAccounts, remove] = useLocalStorage<Account>("accounts", {});
	const [open, setOpen] = useState(false);
	const [disabledPositions, setDisabledPositions] = useState([""]);
	const [isLoading, setIsLoading] = useState(false);
	async function initiateClients(accounts: Account): Promise<PerpClient[]> {
		//initiate the client for each Account
		const clients: PerpClient[] = [];
		Object.keys(accounts).forEach((i) => {
			const perpClient = new ContractClient({
				key: accounts[i].key,
				secret: accounts[i].secret,
				strict_param_validation: true,
				testnet: true,
				recv_window: 5000 * 1000,
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

	//IN = into main account from Account
	//OUT = into subaccoutn from main account
	async function transferAssetsInternally(amount: string, coin: string, fromAccountId: string, toAccountId: string) {
		if (!accounts) {
			return;
		}
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
				toast.success(`Successfully transferred ${amount} ${coin} from account ${fromAccountId} to ${toAccountId}.`, {
					position: toast.POSITION.BOTTOM_RIGHT,
				});
			}
		} catch (err: any) {
			toast.error(`Error: ${err.message}`, {
				position: toast.POSITION.BOTTOM_RIGHT,
			});
		}
	}
	useEffect(() => {
		if (!accounts || Object.keys(accounts).length === 0) {
			setOpen(true);
		}
	}, [accounts]);

	useEffect(() => {
		if (accounts && Object.keys(accounts).length > 0) {
			(async () => {
				try {
					const clients = await initiateClients(accounts);
					setPerpClients(clients);
				} catch (err) {
					console.log(err);
				}
			})();
		}
	}, [accounts]);

	async function getAllAssets() {
		try {
			let clientAssets: ClientAssets = {};
			let assets: Asset[] = [];

			for await (const client of perpClients) {
				const { id, perpClient } = client;
				await new Promise((r) => setTimeout(r, 2000));
				const response = await perpClient.getBalances();
				if (Object.keys(response.result).length > 0 || response.result.list.length > 0) {
					console.log(response.result.list);
					const assets_ = response.result.list.filter((asset: Asset) => {
						if (Number(asset.equity) > 0) {
							return asset;
						}
					});

					clientAssets[id] = assets_;
					assets = [...assets, ...assets_];
					console.log("RESPONSE", clientAssets);
				}
			}
			setAllAssets(filterDuplicateAssets(assets));
			setClientAssets(clientAssets);
		} catch (err) {
			console.log(err);
		}
	}

	useEffect(() => {
		//first one, when initiated
		(async () => {
			await getAllAssets();
			const id = toast.loading(`Fetching positions...`, {
				position: toast.POSITION.BOTTOM_RIGHT,
			});
			const positions = await getAllPositions(perpClients);
			toast.update(id, { render: "fetched positions succesfully.", type: "success", isLoading: false });
			toast.dismiss(id);
			setClientPositions(positions);
		})();
		const id = setInterval(async () => {
			const positions = await getAllPositions(perpClients);
			setClientPositions(positions);
		}, 2500);

		return () => clearInterval(id);
	}, [perpClients]);

	// useEffect(() => {
	// 	(async () => {
	// 		const logger = {
	// 			...DefaultLogger,
	// 			silly: () => {},
	// 		};

	// 		const key = "VGO4EhQVl6QKdR3ASz";
	// 		const secret = "xZ9nkI81I9uLqoHyKtoQckYxWO0YNYKA9lwl";

	// 		const market = "contractUSDT";
	// 		const wsClient = new WebsocketClient(
	// 			{
	// 				key: key,
	// 				secret: secret,
	// 				market: market,
	// 				// testnet: true,
	// 				restOptions: {
	// 					// enable_time_sync: true,
	// 				},
	// 			},
	// 			logger
	// 		);

	// 		wsClient.on("update", (data) => {
	// 			console.log("raw message received ", JSON.stringify(data, null, 2));
	// 		});

	// 		wsClient.on("open", (data) => {
	// 			console.log("connection opened open:", data.wsKey);
	// 		});
	// 		wsClient.on("response", (data) => {
	// 			console.log("ws response: ", JSON.stringify(data, null, 2));
	// 		});
	// 		wsClient.on("reconnect", ({ wsKey }) => {
	// 			console.log("ws automatically reconnecting.... ", wsKey);
	// 		});
	// 		wsClient.on("reconnected", (data) => {
	// 			console.log("ws has reconnected ", data?.wsKey);
	// 		});
	// 		wsClient.on("error", (data) => {
	// 			console.error("ws exception: ", data);
	// 		});

	// 		// subscribe to private endpoints
	// 		// check the api docs in your api category to see the available topics
	// 		// wsClient.subscribe(['position', 'execution', 'order', 'wallet']);

	// 		// Contract v3
	// 		wsClient.subscribe([
	// 			"user.position.contractAccount",
	// 			"user.execution.contractAccount",
	// 			"user.order.contractAccount",
	// 			"user.wallet.contractAccount",
	// 		]);
	// 	})();
	// }, []);

	//get all derivative assets over > 0, for each client
	// useEffect(() => {
	// 	console.log("hit")
	// 	if (isLoading) {
	// 		return;
	// 	}

	// 	setIsLoading(true);
	// 	(async () => {
	// 		try {
	// 			let clientAssets: ClientAssets = {};
	// 			let assets: Asset[] = [];

	// 			for await (const client of perpClients) {
	// 				const { id, perpClient } = client;

	// 				const response = await perpClient.getBalances();
	// 				console.log("RES", response, perpClient);
	// 				if (Object.keys(response.result).length > 0 || response.result.list.length > 0) {
	// 					console.log(response.result.list);
	// 					const assets_ = response.result.list.filter((asset: Asset) => {
	// 						if (Number(asset.equity) > 0) {
	// 							return asset;
	// 						}
	// 					});

	// 					clientAssets[id] = assets_;
	// 					assets = [...assets, ...assets_];
	// 					console.log("RESPONSE", clientAssets);
	// 					setIsLoading(false);
	// 				}
	// 			}
	// 			setAllAssets(filterDuplicateAssets(assets));
	// 			setClientAssets(clientAssets);
	// 		} catch (err) {
	// 			setIsLoading(false);
	// 			console.log(err);
	// 		}
	// 	})();
	// }, [perpClients, isLoading]);

	async function closePosition(client: ContractClient, symbol: string, side: OrderSide, qty: string, accountId: string): Promise<void> {
		const tradeUid = symbol + qty + accountId;
		setDisabledPositions((positions) => [...positions, tradeUid]);
		toast.promise(
			client.submitOrder({
				symbol,
				side,
				orderType: "Market",
				qty,
				timeInForce: "FillOrKill",
			}),
			{
				pending: "Order submited.",
				success: `Successfully ${side === "Buy" ? "bought" : "sold"} ${qty} ${symbol}!`,
				error: "Oops, something went wrong.",
			}
		);
		const positions = await getAllPositions(perpClients);
		setClientPositions(positions);
		setDisabledPositions((positions_) => positions_.filter((i) => i !== tradeUid));
	}

	useEffect(() => {
		if (isCmdKPressed[0] && allAssets.length > 0) {
			if (!openTransferModal) {
				setOpenTransferModal(true);
			} else {
				setOpenTransferModal(false);
			}
		}
	}, [isCmdKPressed, allAssets]);
	return (
		<div className="min-h-screen w-screen bg-gray-50 flex flex-col justify-center">
			<ToastContainer
				position="bottom-right"
				autoClose={2000}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme="light"
			/>
			<DropZoneModal open={open} setOpen={setOpen} accounts={accounts || {}} setAccounts={setAccounts} />
			<AssetTransferModal
				accounts={accounts || {}}
				clientAssets={clientAssets}
				allAssets={allAssets}
				transferAssetsInternally={transferAssetsInternally}
				open={openTransferModal}
				setOpen={setOpenTransferModal}
				getAllAssets={getAllAssets}
			/>

			<div className="mx-auto max-w-7xl sm:px-6 lg:px-8 bg-white w-full py-10 space-y-5">
				<div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6">
					<div className="-ml-4 -mt-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
						<div className="ml-4 mt-4">
							<h3 className="text-lg font-medium leading-6 text-gray-900">Manage your Bybit subaccounts</h3>
							<p className="mt-1 text-sm text-gray-500">
								Transfer assets between subaccounts & manage positions. Press {`"`}CMD + K{`"`} to quickly transfer assets.
							</p>
						</div>
						<div className="ml-4 mt-4 flex-shrink-0">
							<button
								onClick={() => {
									setOpenTransferModal(true);
								}}
								disabled={allAssets.length === 0}
								type="button"
								className="relative inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-150 ease-in disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Transfer assets
							</button>
						</div>
					</div>
				</div>
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
							disabledPositions={disabledPositions}
						/>
					))}
			</div>
		</div>
	);
}
