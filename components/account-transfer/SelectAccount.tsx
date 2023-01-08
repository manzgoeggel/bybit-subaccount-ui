import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Fragment } from "react";

import { Account, AccountType } from "../../pages/index";

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(" ");
}

interface SelectAccountProps {
	accounts?: Account;
	description: string;
	selectedAccount: string;
	setSelectedAccount: (value: string) => void;
	selectedAccountTwo: string;
}

export default function SelectAccount({
	accounts,
	description,
	selectedAccount,
	setSelectedAccount,
	selectedAccountTwo,
}: SelectAccountProps) {
	return (
		<Listbox
			value={selectedAccount}
			onChange={(account) => {
				if (account !== selectedAccountTwo) {
					setSelectedAccount(account);
				}
			}}
		>
			{({ open }) => (
				<div className="w-full">
					<Listbox.Label className="block text-xs font-medium text-gray-700">{description}</Listbox.Label>
					<div className="relative mt-1 w-full">
						<Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
							<span className="flex items-center justify-between pr-2 h-5">
								{/* <img src={selectedAccount.avatar} alt="" className="h-6 w-6 flex-shrink-0 rounded-full" /> */}
								<span className="ml-3 block truncate">{selectedAccount}</span>

								{selectedAccount.length > 0 && (
									<span
										className={`inline-flex items-center rounded ${
											accounts[selectedAccount].type === AccountType.MAIN ? "bg-blue-100" : "bg-fuchsia-100"
										} px-2 py-0.5 w-12 text-center flex justify-center text-xs font-medium ${
											accounts[selectedAccount].type === AccountType.MAIN ? "text-blue-800" : "text-fuchsia-800"
										}`}
									>
										{accounts[selectedAccount].type}
									</span>
								)}
							</span>
							<span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
								<ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
							</span>
						</Listbox.Button>

						<Transition show={open} as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
							<Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
								{accounts !== undefined &&
									Object.keys(accounts).map((accountId) => (
										<Listbox.Option
											key={accountId}
											className={({ active }) =>
												classNames(
													selectedAccount === accountId ? "text-white bg-indigo-600" : "text-gray-900",
													"relative cursor-default select-none py-2 pl-3 pr-9"
												)
											}
											value={accountId}
										>
											{({ selectedAccount, active }) => (
												<>
													<div className="flex items-center justify-between pr-2">
														{/* <img src={person.avatar} alt="" className="h-6 w-6 flex-shrink-0 rounded-full" /> */}
														<span className={classNames(selectedAccount ? "font-semibold" : "font-normal", "ml-3 block truncate")}>
															{accountId}
														</span>
														<span
															className={`inline-flex items-center rounded ${
																accounts[accountId].type === AccountType.MAIN ? "bg-blue-100" : "bg-fuchsia-100"
															} px-2 py-0.5 w-12 text-center flex justify-center text-xs font-medium ${
																accounts[accountId].type === AccountType.MAIN ? "text-blue-800" : "text-fuchsia-800"
															}`}
														>
															{accounts[accountId].type}
														</span>
													</div>

													{selectedAccount ? (
														<span
															className={classNames(
																selectedAccount ? "text-white" : "text-indigo-600",
																"absolute inset-y-0 right-0 flex items-center pr-4"
															)}
														>
															<CheckIcon className="h-5 w-5" aria-hidden="true" />
														</span>
													) : null}
												</>
											)}
										</Listbox.Option>
									))}
							</Listbox.Options>
						</Transition>
					</div>
				</div>
			)}
		</Listbox>
	);
}
