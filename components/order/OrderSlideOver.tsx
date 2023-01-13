import { Dialog, Transition } from "@headlessui/react";
import { XCircleIcon } from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ContractClient, OrderSide, UMOrderType, USDCTimeInForce } from "bybit-api";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { AccountType, PerpClient } from "../../pages/index";
import { colors } from "../PositionTable";
import { OrderTypeObject, SelectOrderType } from "./SelectOrderType";
import { SelectSymbol, Symbol } from "./SelectSymbol";
import { SelectTimeInForce, TimeInForce } from "./SelectTimeInForce";
import { useLocalStorage } from "react-use";
interface Order {
	symbol: string;
	orderId: string;
	side: string;
	orderType: string;
	stopOrderType: string;
	price: string;
	qty: string;
	timeInForce: string;
	orderStatus: string;
	triggerPrice: string;
	orderLinkId: string;
	createdTime: string;
	updatedTime: string;
	takeProfit: string;
	stopLoss: string;
	tpTriggerBy: string;
	slTriggerBy: string;
	triggerBy: string;
	reduceOnly: boolean;
	leavesQty: string;
	leavesValue: string;
	cumExecQty: string;
	cumExecValue: string;
	cumExecFee: string;
	triggerDirection: number;
	cancelType: string;
	lastPriceOnCreated: string;
	iv: string;
	closeOnTrigger: boolean;
}

interface SlideOverProps {
	symbols: Symbol[];
	perpClient: PerpClient;
	open: boolean;
	setOpen: (val: boolean) => void;
}

export default function OrderSlideOver({ symbols, perpClient, open, setOpen }: SlideOverProps) {
	const [orders, setOrders] = useLocalStorage<Order[]>(`order${perpClient.id}`, []);
	const [selectedOrderType, setSelectedOrderType] = useState<OrderTypeObject>({ id: 1, type: "Limit" });
	const [selectedSymbol, setSelectedSymbol] = useState<Symbol | null>(null);
	const [price, setPrice] = useState("0");
	const [quantity, setQuantity] = useState("");
	const [timeInForce, setTimeInForce] = useState<TimeInForce>({ id: 1, type: "GoodTillCancel" });

	const [fetchingAllOrders, setFetchingAllOrders] = useState(false);

	//mock data
	const type = AccountType.MAIN;
	const accountId = "1143183";
	const chosenIndex = 3;

	//@TODO
	/*
	[x] create a new order
	[x] fetch orders
	[x] cancel order
	[x] fetch all available tickers
	[] make this slider dynamic for each (sub)account

	*/

	async function postOrder(
		symbol: string,
		orderType: UMOrderType,
		qty: string,
		timeInForce: USDCTimeInForce,
		side: OrderSide,
		price?: string
	): Promise<void> {
		let requestObject: any = { symbol, side, orderType, qty, timeInForce };
		if (price && orderType !== "Market" && price !== "0") {
			requestObject["price"] = price;
		}
		console.log(requestObject);
		toast.promise(perpClient.perpClient.submitOrder(requestObject), {
			pending: "creating order.",
			success: `Successfully created order.`,
			error: {
				render({ data }: any) {
					return `Error: ${data.message}`;
				},
			},
		});
		if (orders) {
			await fetchNewOrders(orders, symbol);
		} else {
			await fetchAllOpenOrders(symbols);
		}
	}

	async function fetchNewOrders(_orders: Order[], newTicker: string) {
		const _symbols: string[] = _orders.map((i) => i.symbol);
		_symbols.push(newTicker);
		if (_symbols.length > 0) {
			const orders_ = [];
			for await (const symbol of _symbols) {
				await new Promise((r) => setTimeout(r, 250));
				const fetchedOrders = await perpClient.perpClient.getActiveOrders({ symbol });
				if (fetchedOrders.result?.list?.length !== undefined && fetchedOrders.result.list.length > 0) {
					orders_.push(fetchedOrders.result.list);
				}
			}
			const flattenedArray: Order[] = orders_.reduce((acc, val) => acc.concat(val), []);
			setOrders(flattenedArray);
		}
	}

	async function fetchAllOpenOrders(_symbols: Symbol[]) {
		if (_symbols.length > 0) {
			const orders_ = [];
			for await (const item of _symbols) {
				await new Promise((r) => setTimeout(r, 250));
				const fetchedOrders = await perpClient.perpClient.getActiveOrders({ symbol: item.symbol });
				if (fetchedOrders.result?.list?.length !== undefined && fetchedOrders.result.list.length > 0) {
					orders_.push(fetchedOrders.result.list);
				}
			}
			const flattenedArray: Order[] = orders_.reduce((acc, val) => acc.concat(val), []);
			setOrders(flattenedArray);
		}
	}

	async function cancelOrder(symbol: string, orderId: string): Promise<void> {
		toast.promise(perpClient.perpClient.cancelOrder({ symbol, orderId }), {
			pending: "Cancelling order.",
			success: `Successfully cancelled order.`,
			error: {
				render({ data }: any) {
					return `Error: ${data.message}`;
				},
			},
		});
		if (orders) {
			await fetchNewOrders(orders, symbol);
		} else {
			await fetchAllOpenOrders(symbols);
		}
	}

	useEffect(() => {
		if (selectedOrderType.type === "Market") {
			setPrice("0");
		}
	}, [selectedOrderType]);

	useEffect(() => {
		if (orders && orders.length > 0) {
			return;
		}

		(async () => {
			try {
				setFetchingAllOrders(true);

				if (symbols.length > 0) {
					setSelectedSymbol(symbols[0]);
					await fetchAllOpenOrders(symbols);
					setFetchingAllOrders(false);
				}
			} catch (err) {
				setFetchingAllOrders(false);
				console.log(err);
			}
		})();
	}, [orders, symbols]);

	return (
		<>
			<Transition.Root show={open} as={Fragment}>
				<Dialog as="div" className="relative z-10" onClose={setOpen}>
					<div className="fixed inset-0" />

					<div className="fixed inset-0 overflow-hidden">
						<div className="absolute inset-0 overflow-hidden">
							<div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
								<Transition.Child
									as={Fragment}
									enter="transform transition ease-in-out duration-500 sm:duration-700"
									enterFrom="translate-x-full"
									enterTo="translate-x-0"
									leave="transform transition ease-in-out duration-500 sm:duration-700"
									leaveFrom="translate-x-0"
									leaveTo="translate-x-full"
								>
									<Dialog.Panel className="pointer-events-auto w-screen max-w-lg">
										<div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
											<div className="px-4 sm:px-6">
												<span
													className={`inline-flex items-center rounded-md bg-${colors[chosenIndex]}-100 px-2.5 py-0.5 text-xs font-medium text-${colors[chosenIndex]}-800`}
												>
													{perpClient.type === AccountType.MAIN ? "Mainaccount" : "Subaccount"} #{perpClient.id}
												</span>
												<div className="flex items-start justify-between mt-2">
													<Dialog.Title className="text-lg font-medium text-gray-900">Manage orders</Dialog.Title>
													<div className="ml-3 flex h-7 items-center">
														<button
															type="button"
															className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
															onClick={() => setOpen(false)}
														>
															<span className="sr-only">Close panel</span>
															<XMarkIcon className="h-6 w-6" aria-hidden="true" />
														</button>
													</div>
												</div>
											</div>
											<div className="relative mt-6 flex flex-col px-4 sm:px-6 space-y-6 ">
												<div className="flex space-x-6 w-full justify-center">
													<div className="w-full">
														<label htmlFor="price" className="block text-xs font-medium text-gray-700">
															Price
														</label>
														<div
															className={`transition-all duration-150 ease-in relative mt-1 rounded-md shadow-sm ${
																selectedOrderType.type === "Market" ? "opacity-50 hover:cursor-not-allowed" : "opacity-100 cursor-auto"
															}`}
														>
															<input
																type="text"
																name="price"
																value={price}
																onChange={(e) => {
																	setPrice(e.target.value);
																}}
																onPaste={(e) => {
																	e.preventDefault();
																	setPrice(e?.clipboardData.getData("Text"));
																}}
																id="price"
																disabled={selectedOrderType.type === "Market"}
																className="block w-full rounded-md border-gray-300 pl-3  pr-24 focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
																placeholder="0.00"
																aria-describedby="price-currency"
															/>
														</div>
													</div>
													<SelectOrderType selected={selectedOrderType} setSelected={setSelectedOrderType} />
												</div>

												<div className="flex space-x-6 w-full justify-center">
													<div className="w-full">
														<label htmlFor="price" className="block text-xs font-medium text-gray-700">
															Amount
														</label>
														<div className="relative mt-1 rounded-md shadow-sm">
															<input
																type="text"
																name="price"
																value={quantity}
																onChange={(e) => {
																	setQuantity(e.target.value);
																}}
																onPaste={(e) => {
																	e.preventDefault();
																	setQuantity(e?.clipboardData.getData("Text"));
																}}
																id="price"
																className="block w-full rounded-md border-gray-300 pl-3  pr-24 focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
																placeholder="0.00"
																aria-describedby="price-currency"
															/>
														</div>
													</div>
													<SelectSymbol symbols={symbols} selectedSymbol={selectedSymbol} setSelectedSymbol={setSelectedSymbol} />
												</div>
												<div className="flex space-x-6">
													<SelectTimeInForce timeInForce={timeInForce} setTimeInForce={setTimeInForce} />
												</div>

												{/* buy / sell button */}
												<div className="flex justify-evenly w-full space-x-6 mx-auto">
													<button
														onClick={() => {
															if (selectedSymbol) {
																postOrder(selectedSymbol?.symbol, selectedOrderType.type, quantity, timeInForce.type, "Buy", price);
															}
															
														}}
														disabled={!selectedSymbol || selectedSymbol === null || Number(quantity) <= 0}
														type="button"
														className="disabled:opacity-50 disabled:cursor-not-allowed  items-center rounded border border-transparent bg-green-500 px-2.5 py-1.5 w-full text-center flex justify-center text-xs font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:green-500 focus:ring-offset-2 transition-all duration-150 ease-in"
													>
														Buy
													</button>
													<button
														onClick={() => {
															if (selectedSymbol) {
																postOrder(selectedSymbol?.symbol, selectedOrderType.type, quantity, timeInForce.type, "Sell", price);
															}
														
														}}
														type="button"
														disabled={!selectedSymbol || selectedSymbol === null || Number(quantity) <= 0}
														className="disabled:opacity-50 disabled:cursor-not-allowed items-center rounded border border-transparent bg-red-500 px-2.5 py-1.5 w-full text-center flex justify-center text-xs font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:red-500 focus:ring-offset-2 transition-all duration-150 ease-in"
													>
														Sell
													</button>
												</div>

												{/* order overview */}
												<div className="border-b border-gray-200 py-2 ">
													<h3 className="text-xs font-base leading-6 text-gray-900">Order overview</h3>
												</div>
											</div>
											<ul role="list" className="divide-y divide-gray-200  flex-1 overflow-y-auto px-4 sm:px-6">
												{fetchingAllOrders ? (
													<div className="text-gray-600 text-xs">fetching orders...</div>
												) : (
													<>
														{orders && orders.length > 0 ? (
															<>
																{" "}
																{orders.map((order: Order, index: number) => (
																	<li
																		key={order.orderId + timeInForce + index}
																		className="py-4 text-gray-800 text-tiny flex w-full space-x-2 flex justify-between"
																	>
																		<p className={`font-medium ${order.side === "Buy" ? "text-green-500" : "text-red-500"}`}>
																			{order.side}
																		</p>
																		<p className="font-semibold">{order.qty}</p>
																		<p className="font-semibold">{order.symbol}</p>
																		<p>@ ${order.price}</p>
																		<p>(notional ~${(Number(order.price) * Number(order.qty)).toFixed(2)})</p>
																		<p className="text-gray-500">{order.orderStatus}</p>
																		<p className="text-gray-500">{order.timeInForce}</p>
																		<XCircleIcon
																			onClick={() => {
																				cancelOrder(order.symbol, order.orderId);
																			}}
																			className="h-3 w-3 text-gray-500 hover:text-red-500 ease-in transition-all cursor-pointer"
																			aria-hidden="true"
																		/>
																	</li>
																))}
															</>
														) : (
															<div className="text-gray-600 text-xs">no orders found.</div>
														)}
													</>
												)}
											</ul>
										</div>
									</Dialog.Panel>
								</Transition.Child>
							</div>
						</div>
					</div>
				</Dialog>
			</Transition.Root>
		</>
	);
}
