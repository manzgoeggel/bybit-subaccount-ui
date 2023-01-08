import { Dialog, Transition } from "@headlessui/react";
import { ArrowsRightLeftIcon } from "@heroicons/react/20/solid";
import { Fragment, useState } from "react";
import Amount from "./Amount";
import SelectAccount from "./SelectAccount";
import SelectCoin from "./SelectCoin";

import { Account, AccountType } from "../../pages/index";
export default function AssetTransferModal() {
	const [open, setOpen] = useState(true);
	const [selectedFromAccount, setSelectedFromAccount] = useState("1139313");
	const [selectedToAccount, setSelectedToAccount] = useState("1139316");

	const mockAccounts: Account = {
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

	function swapSelectedAccounts() {
		const x = selectedFromAccount;
		const y = selectedToAccount;
		setSelectedFromAccount(y);
		setSelectedToAccount(x);
	}

	return (
		<Transition.Root show={open} as={Fragment}>
			<Dialog as="div" className="relative z-10" onClose={setOpen}>
				<Transition.Child
					as={Fragment}
					enter="ease-out duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
				</Transition.Child>

				<div className="fixed inset-0 z-10 overflow-y-auto">
					<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
						<Transition.Child
							as={Fragment}
							enter="ease-out duration-300"
							enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
							enterTo="opacity-100 translate-y-0 sm:scale-100"
							leave="ease-in duration-200"
							leaveFrom="opacity-100 translate-y-0 sm:scale-100"
							leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
						>
							<Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl sm:p-6">
								<div className="space-y-6">
									<div className="mt-3 text-center sm:mt-0 sm:text-left">
										<Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
											Transfer assets between
										</Dialog.Title>
										<div className="mt-2">
											<p className="text-sm text-gray-500">Transfer assets between derivatives accounts.</p>
										</div>
									</div>

									{/* from to account */}
									<div className="flex justify-between items-center">
										<div className="w-2/5">
											<SelectAccount
												accounts={mockAccounts}
												description={"From"}
												selectedAccount={selectedFromAccount}
												setSelectedAccount={setSelectedFromAccount}
												selectedAccountTwo={selectedToAccount}
											/>
										</div>
										<div
											onClick={swapSelectedAccounts}
											className="h-7 w-7 rounded-full bg-gray-200 text-gray-700 items-center flex justify-center flex-col cursor-pointer hover:opacity-50 transiton-all duration-150 ease-in"
										>
											<ArrowsRightLeftIcon aria-hidden={true} className="h-4 w-4" />
										</div>

										<div className="w-2/5">
											<SelectAccount
												accounts={mockAccounts}
												description={"To"}
												selectedAccount={selectedToAccount}
												setSelectedAccount={setSelectedToAccount}
												selectedAccountTwo={selectedFromAccount}
											/>
										</div>
									</div>

									<div className="flex justify-between w-full">
										<SelectCoin />
									</div>
									<div className="flex justify-between w-full">
										<Amount />
									</div>
								</div>
								<div className="mt-5 sm:mt-6">
									<button
										type="button"
										className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
										onClick={() => setOpen(false)}
									>
										Transfer
									</button>
								</div>
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	);
}
