import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { Fragment, useState } from 'react'
import { USDCTimeInForce } from "bybit-api";
const timeInForces = [
  { id: 1, type: 'GoodTillCancel' },
  { id: 2, type: 'ImmediateOrCancel' },
  { id: 3, type: 'FillOrKill' },
  { id: 4, type: 'PostOnly' },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export interface TimeInForce {
  id: number;
  type: USDCTimeInForce;
}

interface SelectTimeInForceProps {
  timeInForce: TimeInForce;
  setTimeInForce: (val: TimeInForce) => void;
}

export function SelectTimeInForce({timeInForce, setTimeInForce}: SelectTimeInForceProps) {

  return (
    <Listbox value={timeInForce} onChange={setTimeInForce}>
      {({ open }) => (
        <div className="w-1/2">
          <Listbox.Label className="block text-xs font-medium text-gray-700">Time in force</Listbox.Label>
          <div className="relative mt-1 w-full">
            <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-xs">
              <span className="block truncate">{timeInForce.type}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-xs">
                {timeInForces.map((person) => (
                  <Listbox.Option
                    key={person.id}
                    className={({ active }) =>
                      classNames(
                        active ? 'text-white bg-indigo-600' : 'text-gray-900',
                        'relative cursor-default select-none py-2 pl-3 pr-9'
                      )
                    }
                    value={person}
                  >
                    {({ timeInForce, active }) => (
                      <>
                        <span className={classNames(timeInForce ? 'font-semibold' : 'font-normal', 'block truncate')}>
                          {person.type}
                        </span>

                        {timeInForce ? (
                          <span
                            className={classNames(
                              active ? 'text-white' : 'text-indigo-600',
                              'absolute inset-y-0 right-0 flex items-center pr-4'
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
  )
}
