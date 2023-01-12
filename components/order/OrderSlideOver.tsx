import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ContractClient } from "bybit-api";
import { Fragment, useEffect, useState, useMemo } from "react";
import { AccountType } from "../../pages/index";
import { colors } from "../PositionTable";
import SelectOrderType from "./SelectOrderType";
import SelectTimeInForce from "./SelectTimeInForce";
import { toast, ToastContainer } from "react-toastify";
import { XCircleIcon} from '@heroicons/react/20/solid'
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

export default function OrderSlideOver() {
	const [open, setOpen] = useState(true);
	const [orders, setOrders] = useState<Order[]>([]);

	//mock data
	const type = AccountType.MAIN;
	const accountId = "1143183";
	const chosenIndex = 3;

	const perpClient = useMemo(() => {
		return new ContractClient({
			key: "VGO4EhQVl6QKdR3ASz",
			secret: "xZ9nkI81I9uLqoHyKtoQckYxWO0YNYKA9lwl",
			strict_param_validation: true,
			testnet: true,
			recv_window: 5000 * 1000,
		});
	}, []);

	//@TODO
	/*
	[] create a new order
	[] fetch orders
	[] cancel order

	*/
	useEffect(() => {
		(async () => {
			try {
				// const submittedOrder = await perpClient.submitOrder({
				// 	symbol: "ETHUSDT",
				// 	side: "Buy",
				// 	qty: "0.05",
				// 	orderType: "Limit",
				// 	price: "500",
				// 	timeInForce: "GoodTillCancel",
				// });

				const orders_ = await perpClient.getActiveOrders({ symbol: "ETHUSDT" });
				console.log("all orders", orders_.result);

				if (orders_.result.list.length > 0) {
					setOrders(orders_.result.list);
				}
			} catch (err) {
				console.log(err);
			}
		})();
	}, []);

	async function cancelOrder(symbol: string, orderId: string): Promise<void> {
		const order = await perpClient.cancelAllOrders(symbol);
		console.log(order);
		// toast.promise(perpClient.cancelOrder({ symbol, orderId }), {
		// 	pending: "Cancelling order.",
		// 	success: `Successfully cancelled order.`,
		// 	error: "Oops, something went wrong.",
		// });
		console.log(orders.length);
		const orders_ = await perpClient.getActiveOrders({ symbol });
		console.log(orders_.result.list.length);
		if (orders_.result.list.length > 0) {
			setOrders(orders_.result.list);
		}
	}

	return (
		<>
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
								<Dialog.Panel className="pointer-events-auto w-screen max-w-md">
									<div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
										<div className="px-4 sm:px-6">
											<span
												className={`inline-flex items-center rounded-md bg-${colors[chosenIndex]}-100 px-2.5 py-0.5 text-xs font-medium text-${colors[chosenIndex]}-800`}
											>
												{type === AccountType.MAIN ? "Mainaccount" : "Subaccount"} #{accountId}
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
											{/* amount & order type field */}

											<div className="flex space-x-6">
												<div className="w-full">
													<label htmlFor="price" className="block text-xs font-medium text-gray-700">
														Amount
													</label>
													<div className="relative mt-1 rounded-md shadow-sm">
														<input
															type="text"
															name="price"
															// value={amount}
															// onChange={(e) => {
															// 	setAmount(e.target.value);
															// }}
															// onPaste={(e) => {
															// 	e.preventDefault();
															// 	setAmount(e?.clipboardData.getData("Text"));
															// }}
															id="price"
															className="block w-full rounded-md border-gray-300 pl-3  pr-24 focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
															placeholder="0.00"
															aria-describedby="price-currency"
														/>
													</div>
												</div>
											</div>
											<div className="flex space-x-6">
												<SelectOrderType />
												<SelectTimeInForce />
											</div>

											{/* buy / sell button */}
											<div className="flex justify-evenly w-full space-x-6 mx-auto">
												<button
													type="button"
													className="inline-flex items-center rounded border border-transparent bg-green-500 px-2.5 py-1.5 w-full text-center flex justify-center text-xs font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:green-500 focus:ring-offset-2 transition-all duration-150 ease-in"
												>
													Buy
												</button>
												<button
													type="button"
													className="inline-flex items-center rounded border border-transparent bg-red-500 px-2.5 py-1.5 w-full text-center flex justify-center text-xs font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:red-500 focus:ring-offset-2 transition-all duration-150 ease-in"
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
											{orders.length > 0 ? (
												<>
													{" "}
													{orders.map((order: Order) => (
														<li key={order.orderId} className="py-4 text-gray-800 text-tiny flex w-full space-x-2">
															<p className={`font-medium ${order.side === "Buy" ? "text-green-500" : "text-red-500"}`}>{order.side}</p>
															<p className="font-semibold">{order.qty}</p>
															<p className="font-semibold">{order.symbol}</p>
															<p>@ ${order.price}</p>
															<p>(notional ~${(Number(order.price) * Number(order.qty)).toFixed(2)})</p>
															<p className="text-gray-500">{order.orderStatus}</p>
															<p className="text-gray-500">{order.timeInForce}</p>
															<XCircleIcon onClick={()=> { cancelOrder(order.symbol, order.orderId)}} className="h-3 w-3" aria-hidden="true" />
														</li>
													))}
												</>
											) : (
												<div className="text-gray-600 text-xs">no orders found.</div>
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
