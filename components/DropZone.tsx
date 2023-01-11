import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { AccountType, Account } from "../pages/index";
import { toast } from "react-toastify";
interface DropZoneModal {
	accounts: Account;
	setAccounts: (accounts: Account) => void;
	open: boolean;
	setOpen: (val: boolean) => void;
}

export default function DropZoneModal({ accounts, setAccounts, open, setOpen }: DropZoneModal) {
	const onDrop = useCallback((acceptedFiles: any) => {
		acceptedFiles.forEach((file: any) => {
			const reader = new FileReader();

			reader.onabort = () => console.log("file reading was aborted");
			reader.onerror = () => console.log("file reading has failed");
			reader.onload = () => {
				// Do whatever you want with the file contents
				// const x = String.fromCharCode.apply(null, new Uint8Array(reader.result))
				const parsedFile = JSON.parse(new TextDecoder().decode(reader.result));

				if (Object.keys(parsedFile).length > 0) {
					toast.success(`Successfully loaded config.`, {
						position: toast.POSITION.BOTTOM_RIGHT,
					});
					setAccounts(parsedFile);
					setOpen(false);
				}
			};
			reader.readAsArrayBuffer(file);
		});
	}, []);
	const { getRootProps, getInputProps } = useDropzone({ onDrop, maxFiles: 1 });

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
								<div
									className="h-64 w-full bg-gray-200 hover:bg-gray-100 hover:border-gray-400 transition-all duration-150 ease-in text-gray-700 flex flex-col text-center justify-center border-2 border-gray-500 border-dashed rounded-md font-medium text-sm"
									{...getRootProps()}
								>
									<input {...getInputProps()} />
									<p>Drag drop the JSON config file here, or click to select it.</p>
								</div>
								<div className="mt-5 sm:mt-6">
									<button
										type="button"
										className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
										onClick={() => setOpen(false)}
									>
										close
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
