import { Provider, InjectionToken, Type, inject } from '@angular/core';
import { take } from 'rxjs/operators';
import { ComponentStore } from './component-store';

/**
 * The interface for the lifecycle hook
 * called after the ComponentStore is instantiated.
 *
 * @public
 */
export interface OnStoreInit {
  readonly ngrxOnStoreInit: () => void;
}

/**
 * The interface for the lifecycle hook
 * called only once after the ComponentStore
 * state is first initialized.
 *
 * @public
 */
export interface OnStateInit {
  readonly ngrxOnStateInit: () => void;
}

/**
 * Checks to see if the OnInitStore lifecycle hook
 * is defined on the ComponentStore.
 *
 * @param cs - ComponentStore type
 * @returns boolean
 *
 * @public
 */
export function isOnStoreInitDefined(cs: unknown): cs is OnStoreInit {
  return typeof (cs as OnStoreInit).ngrxOnStoreInit === 'function';
}

/**
 * Checks to see if the OnInitState lifecycle hook
 * is defined on the ComponentStore.
 *
 * @param cs - ComponentStore type
 * @returns boolean
 *
 * @public
 */
export function isOnStateInitDefined(cs: unknown): cs is OnStateInit {
  return typeof (cs as OnStateInit).ngrxOnStateInit === 'function';
}

/**
 * Function that returns the ComponentStore
 * class registered as a provider,
 * and uses a factory provider to instantiate the
 * ComponentStore and run the lifecycle hooks
 * defined on the ComponentStore.
 *
 * @param componentStoreClass - The ComponentStore with lifecycle hooks
 * @returns Provider[]
 *
 * @example
 *
 * ```ts
 * @Injectable()
 * export class MyStore
 *    extends ComponentStore<{ init: boolean }>
 *    implements OnStoreInit, OnStateInit
 *   {
 *
 *   constructor() {
 *     super({ init: true });
 *   }
 *
 *   ngrxOnStoreInit() {
 *     // runs once after store has been instantiated
 *   }
 *
 *   ngrxOnStateInit() {
 *     // runs once after store state has been initialized
 *   }
 * }
 *
 * @Component({
 *   providers: [
 *     provideComponentStore(MyStore)
 *   ]
 * })
 * export class MyComponent {
 *   constructor(private myStore: MyStore) {}
 * }
 * ```
 *
 * @public
 */
export function provideComponentStore<T extends object>(
  componentStoreClass: Type<ComponentStore<T>>
): Provider[] {
  const CS_WITH_HOOKS = new InjectionToken<ComponentStore<T>>(
    '@ngrx/component-store ComponentStore with Hooks'
  );

  return [
    { provide: CS_WITH_HOOKS, useClass: componentStoreClass },
    {
      provide: componentStoreClass,
      useFactory: () => {
        const componentStore = inject(CS_WITH_HOOKS);

        // Set private property that CS has been provided with lifecycle hooks
        componentStore['ɵhasProvider'] = true;

        if (isOnStoreInitDefined(componentStore)) {
          componentStore.ngrxOnStoreInit();
        }

        if (isOnStateInitDefined(componentStore)) {
          componentStore.state$
            .pipe(take(1))
            .subscribe(() => componentStore.ngrxOnStateInit());
        }

        return componentStore;
      },
    },
  ];
}
