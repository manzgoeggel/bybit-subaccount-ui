import { ContractClient, OrderSide } from "bybit-api";
import { useEffect, useMemo, useState } from "react";

import { AccountType } from "../pages/index";
export interface Position {
	positionIdx: number;
	riskId: number;
	symbol: string;
	side: string;
	size: string;
	positionValue: string;
	entryPrice: string;
	tradeMode: number;
	autoAddMargin: number;
	leverage: string;
	positionBalance: string;
	liqPrice: string;
	bustPrice: string;
	takeProfit: string;
	stopLoss: string;
	trailingStop: string;
	unrealisedPnl: string;
	createdTime: string;
	updatedTime: string;
	tpSlMode: string;
	riskLimitValue: string;
	activePrice: string;
	markPrice: string;
	cumRealisedPnl: string;
	positionMM: string;
	positionIM: string;
	positionStatus: string;
	sessionAvgPrice: string;
	occClosingFee: string;
	avgPrice: string;
}

interface PositionTableProps {
	accountId: string;
	positions: Position[];
	colorIndex: number;
	closePosition: (client: ContractClient, symbol: string, side: OrderSide, qty: string) => void;
	client: ContractClient;
	type: AccountType
}

export interface Asset {
	coin: string;
	equity: string;
	walletBalance: string;
	positionMargin: string;
	availableBalance: string;
	orderMargin: string;
	occClosingFee: string;
	occFundingFee: string;
	unrealisedPnl: string;
	cumRealisedPnl: string;
	givenCash: string;
	serviceCash: string;
	accountIM: string;
	accountMM: string;
}

export function PositionTable({
	accountId,
	positions,
	colorIndex,
	closePosition,
	client,
	type,
}: PositionTableProps) {
	const colors = ["blue", "purple", "green", "orange", "lime", "fuchsia", "sky", "pink", "teal", "rose"];
	const [assets, setAssets] = useState<Asset[]>([]);
	const sortedPositions: Position[] = useMemo(() => {
		if (positions !== undefined && positions.length > 0) {
			return positions.sort((a, b) => {
				const valueA = Number(a.positionValue);
				const valueB = Number(b.positionValue);
				if (valueA > valueB) {
					return -1;
				}
				if (valueA < valueB) {
					return 1;
				}
				return 0;
			});
		}
    return [];
	}, [positions]);
	const chosenIndex = useMemo(() => {
		if (colorIndex > colors.length) {
			return 0;
		}
		return colorIndex;
	}, [colors.length, colorIndex]);

	useEffect(() => {
		(async () => {
			try {
				const response = await client.getBalances();

				if (response.result.list.length > 0) {
					const assets_ = response.result.list.filter((asset: Asset) => {
						if (Number(asset.equity) > 0) {
							return asset;
						}
					});
					setAssets(assets_);

				}
			} catch (err) {
				console.log(err);
			}
		})();
	}, [client]);

	return (
		<div className="px-4 sm:px-6 lg:px-8">
			<div className="sm:flex sm:items-center">
				<div className="sm:flex-auto">
					<span
						className={`inline-flex items-center rounded-md bg-${colors[chosenIndex]}-100 px-2.5 py-0.5 text-xs font-medium text-${colors[chosenIndex]}-800`}
					>
						{type === AccountType.MAIN ? "Mainaccount" : "Subaccount"} #{accountId}
					</span>

					<div>
						<div> available derivative balances</div>
						{assets.length > 0 ? (
							<div className="flex flex-col space-y-2">
								{assets.map((asset) => (
									<div key={asset.coin} className="flex space-x-4 text-xs">
										<div>
											{asset.coin}: {asset.availableBalance}
										</div>

						
									</div>
								))}
							</div>
						) : (
							<div>no assets found in derivatives</div>
						)}
					</div>
				</div>
			</div>
			<div className="mt-3 flex flex-col">
				<div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
					<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
						<div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
							<table className="min-w-full divide-y divide-gray-300">
								<thead className="bg-gray-50">
									<tr>
										<th scope="col" className="whitespace-nowrap py-1 pl-4 pr-3 text-left text-xs font-medium text-gray-500 sm:pl-6">
											Symbol
										</th>
										<th scope="col" className="whitespace-nowrap px-2 py-1 text-left text-xs font-medium text-gray-500">
											Side
										</th>
										<th scope="col" className="whitespace-nowrap px-2 py-1 text-left text-xs font-medium text-gray-500">
											Position Size
										</th>
										<th scope="col" className="whitespace-nowrap px-2 py-1 text-left text-xs font-medium text-gray-500">
											Notional Size
										</th>
										<th scope="col" className="whitespace-nowrap px-2 py-1 text-left text-xs font-medium text-gray-500">
											Est. liquidation price
										</th>
										<th scope="col" className="whitespace-nowrap px-2 py-1 text-left text-xs font-medium text-gray-500">
											Mark price
										</th>
										<th scope="col" className="whitespace-nowrap px-2 py-1 text-left text-xs font-medium text-gray-500">
											PnL
										</th>
										<th scope="col" className="whitespace-nowrap px-2 py-1 text-left text-xs font-medium text-gray-500">
											Avg open price
										</th>
										<th scope="col" className="relative whitespace-nowrap py-1 pl-3 pr-4 sm:pr-6">
											<span className="sr-only">Edit</span>
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 bg-white">
									{sortedPositions.map((position) => (
										<tr key={position.symbol} className="hover:bg-gray-50 transition-all duration-150 ease-in cursor-pointer">
											<td className="whitespace-nowrap py-2 pl-4 pr-3 text-xs text-gray-900 sm:pl-6 font-medium">{position.symbol}</td>
											<td
												className={`whitespace-nowrap px-2 py-2 text-xs font-medium  ${
													position.side.toLowerCase() === "sell" ? "text-red-500" : "text-green-500"
												}`}
											>
												{position.side}
											</td>
											<td className="whitespace-nowrap px-2 py-2 text-xs text-gray-500">{position.size}</td>
											<td className="whitespace-nowrap px-2 py-2 text-xs text-gray-500">${position.positionValue}</td>
											<td className="whitespace-nowrap px-2 py-2 text-xs text-gray-500">${position.liqPrice}</td>
											<td className="whitespace-nowrap px-2 py-2 text-xs text-gray-500">${position.markPrice}</td>
											<td
												className={`whitespace-nowrap px-2 py-2 text-xs ${
													Number(position.unrealisedPnl) < 0 ? "text-red-500" : "text-green-500"
												}`}
											>
												${position.unrealisedPnl}
											</td>
											<td className="whitespace-nowrap px-2 py-2 text-xs text-gray-500">${position.avgPrice}</td>
											<td className="relative whitespace-nowrap py-2 pl-3 pr-4 text-right text-xs font-medium sm:pr-6">
												<div
													onClick={() => {
														closePosition(client, position.symbol, position.side.toLowerCase() === "sell" ? "Buy" : "Sell", position.size);
													}}
													className="text-indigo-600 hover:text-indigo-900"
												>
													Close position
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
