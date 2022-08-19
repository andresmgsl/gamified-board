import { inject, Injectable } from '@angular/core';
import {
  ComponentStore,
  OnStoreInit,
  tapResponse,
} from '@ngrx/component-store';
import { combineLatest, EMPTY, map, Observable, switchMap } from 'rxjs';
import { PluginsService } from '../plugins';
import {
  ApplicationApiService,
  ApplicationDto,
  CollectionApiService,
  CollectionDto,
  DocumentDto,
  GenericCollection,
  GenericInstruction,
  InstructionApiService,
  InstructionDto,
  TaskDto,
  WorkspaceApiService,
  WorkspaceDto,
} from '../services';
import { Option } from '../utils';

export interface BoardInstruction {
  id: string;
  name: string;
  tasks: TaskDto[];
  documents: DocumentDto[];
}

interface ViewModel {
  workspaceId: Option<string>;
  currentApplicationId: Option<string>;
  workspace: Option<WorkspaceDto & { applicationIds: string[] }>;
  applications: Option<
    (ApplicationDto & { collectionIds: string[]; instructionIds: string[] })[]
  >;
  currentApplicationInstructions: Option<BoardInstruction[]>;
  workspaceInstructions: Option<InstructionDto[]>;
  workspaceCollections: Option<CollectionDto[]>;
  selectedDocumentId: Option<string>;
  selectedTaskId: Option<string>;
  selectedCollectionId: Option<string>;
  selectedInstructionId: Option<string>;
  activeCollectionId: Option<string>;
  activeInstructionId: Option<string>;
  instructionSlotIds: Option<string>[];
  collectionSlotIds: Option<string>[];
}

const initialState: ViewModel = {
  workspaceId: null,
  workspace: null,
  currentApplicationId: null,
  applications: null,
  currentApplicationInstructions: null,
  workspaceInstructions: null,
  workspaceCollections: null,
  selectedDocumentId: null,
  selectedTaskId: null,
  selectedCollectionId: null,
  selectedInstructionId: null,
  activeCollectionId: null,
  activeInstructionId: null,
  instructionSlotIds: [null, null, null, null, null, null],
  collectionSlotIds: [null, null, null, null, null, null],
};

@Injectable()
export class BoardStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _pluginsService = inject(PluginsService);
  private readonly _workspaceApiService = inject(WorkspaceApiService);
  private readonly _applicationApiService = inject(ApplicationApiService);
  private readonly _instructionApiService = inject(InstructionApiService);
  private readonly _collectionApiService = inject(CollectionApiService);

  readonly workspaceId$ = this.select(({ workspaceId }) => workspaceId);
  readonly workspace$ = this.select(({ workspace }) => workspace);
  readonly currentApplicationId$ = this.select(
    ({ currentApplicationId }) => currentApplicationId
  );
  readonly applications$ = this.select(({ applications }) => applications);
  readonly workspaceInstructions$ = this.select(
    ({ workspaceInstructions }) => workspaceInstructions
  );
  readonly workspaceCollections$ = this.select(
    ({ workspaceCollections }) => workspaceCollections
  );
  readonly workspaceApplications$ = this.select(
    this.applications$,
    this.workspaceInstructions$,
    this.workspaceCollections$,
    (applications, instructions, collections) =>
      applications?.map((application) => ({
        id: application.id,
        name: application.name,
        instructions:
          instructions?.filter(({ applicationId }) => applicationId) ?? [],
        collections:
          collections?.filter(({ applicationId }) => applicationId) ?? [],
      })) ?? []
  );
  readonly otherApplications$ = this.select(
    this.applications$,
    this.currentApplicationId$,
    this.workspaceInstructions$,
    this.workspaceCollections$,
    (applications, currentApplicationId, instructions, collections) =>
      applications
        ?.filter(({ id }) => id !== currentApplicationId)
        .map((application) => ({
          id: application.id,
          name: application.name,
          instructions:
            instructions?.filter(
              (instruction) => instruction.applicationId === application.id
            ) ?? [],
          collections:
            collections?.filter(
              (collection) => collection.applicationId === application.id
            ) ?? [],
        })) ?? []
  );
  readonly currentApplication$ = this.select(
    this.applications$,
    this.currentApplicationId$,
    this.workspaceInstructions$,
    this.workspaceCollections$,
    (applications, currentApplicationId, instructions, collections) => {
      if (applications === null) {
        return null;
      }

      const currentApplication =
        applications.find(({ id }) => id === currentApplicationId) ?? null;

      if (currentApplication === null) {
        return null;
      }

      return {
        id: currentApplication.id,
        name: currentApplication.name,
        instructions:
          instructions?.filter(
            (instruction) => instruction.applicationId === currentApplicationId
          ) ?? [],
        collections:
          collections?.filter(
            (collection) => collection.applicationId === currentApplicationId
          ) ?? [],
      };
    }
  );
  readonly currentApplicationInstructions$ = this.select(
    ({ currentApplicationInstructions }) => currentApplicationInstructions
  );
  readonly selectedDocument$ = this.select(
    this.currentApplicationInstructions$,
    this.select(({ selectedDocumentId }) => selectedDocumentId),
    (currentApplicationInstructions, selectedDocumentId) => {
      if (
        currentApplicationInstructions === null ||
        selectedDocumentId === null
      ) {
        return null;
      }

      return (
        currentApplicationInstructions
          .find(({ documents }) =>
            documents.some((document) => document.id === selectedDocumentId)
          )
          ?.documents.find((document) => document.id === selectedDocumentId) ??
        null
      );
    }
  );
  readonly selectedTask$ = this.select(
    this.currentApplicationInstructions$,
    this.select(({ selectedTaskId }) => selectedTaskId),
    (currentApplicationInstructions, selectedTaskId) => {
      if (currentApplicationInstructions === null || selectedTaskId === null) {
        return null;
      }

      return (
        currentApplicationInstructions
          .find(({ tasks }) => tasks.some((task) => task.id === selectedTaskId))
          ?.tasks.find((task) => task.id === selectedTaskId) ?? null
      );
    }
  );
  readonly activeCollectionId$ = this.select(
    ({ activeCollectionId }) => activeCollectionId
  );
  readonly activeInstructionId$ = this.select(
    ({ activeInstructionId }) => activeInstructionId
  );
  readonly collections$ = this.select(
    this.workspaceCollections$,
    (workspaceCollections) => {
      if (workspaceCollections === null) {
        return null;
      }

      return [
        ...workspaceCollections.map<GenericCollection>((collection) => ({
          id: collection.id,
          name: collection.name,
          thumbnailUrl: collection.thumbnailUrl,
          applicationId: collection.applicationId,
          workspaceId: collection.workspaceId,
          isInternal: true,
        })),
        ...this._pluginsService.plugins.reduce<GenericCollection[]>(
          (collections, plugin) => [
            ...collections,
            ...plugin.accounts.reduce<GenericCollection[]>(
              (innerCollections, account) => [
                ...innerCollections,
                {
                  id: `${plugin.namespace}/${plugin.name}/${account.name}`,
                  name: account.name,
                  thumbnailUrl: `assets/plugins/${plugin.namespace}/${plugin.name}/accounts/${account.name}.png`,
                  applicationId: plugin.name,
                  workspaceId: plugin.namespace,
                  isInternal: false,
                },
              ],
              []
            ),
          ],
          []
        ),
      ];
    }
  );
  readonly instructions$ = this.select(
    this.workspaceInstructions$,
    (workspaceInstructions) => {
      if (workspaceInstructions === null) {
        return null;
      }

      return [
        ...workspaceInstructions.map<GenericInstruction>((instruction) => ({
          id: instruction.id,
          name: instruction.name,
          thumbnailUrl: instruction.thumbnailUrl,
          applicationId: instruction.applicationId,
          workspaceId: instruction.workspaceId,
          isInternal: true,
        })),
        ...this._pluginsService.plugins.reduce<GenericInstruction[]>(
          (instructions, plugin) => [
            ...instructions,
            ...plugin.instructions.reduce<GenericInstruction[]>(
              (innerInstructions, instruction) => [
                ...innerInstructions,
                {
                  id: `${plugin.namespace}/${plugin.name}/${instruction.name}`,
                  name: instruction.name,
                  thumbnailUrl: `assets/plugins/${plugin.namespace}/${plugin.name}/instructions/${instruction.name}.png`,
                  applicationId: plugin.name,
                  workspaceId: plugin.namespace,
                  isInternal: false,
                },
              ],
              []
            ),
          ],
          []
        ),
      ];
    }
  );
  readonly activeInstruction$: Observable<Option<GenericInstruction>> =
    this.select(
      this.instructions$,
      this.select(({ activeInstructionId }) => activeInstructionId),
      (instructions, activeInstructionId) => {
        if (instructions === null || activeInstructionId === null) {
          return null;
        }

        return (
          instructions?.find(
            (instruction) => instruction.id === activeInstructionId
          ) ?? null
        );
      }
    );
  readonly activeCollection$: Observable<Option<GenericCollection>> =
    this.select(
      this.collections$,
      this.select(({ activeCollectionId }) => activeCollectionId),
      (collections, activeCollectionId) => {
        if (collections === null || activeCollectionId === null) {
          return null;
        }

        return (
          collections?.find(
            (collection) => collection.id === activeCollectionId
          ) ?? null
        );
      }
    );
  readonly instructionSlots$: Observable<Option<GenericInstruction>[]> =
    this.select(
      this.instructions$,
      this.select(({ instructionSlotIds }) => instructionSlotIds),
      (instructions, instructionSlotIds) =>
        instructionSlotIds.map((instructionId) => {
          if (instructionId === null) {
            return null;
          }

          return (
            instructions?.find(
              (instruction) => instruction.id === instructionId
            ) ?? null
          );
        })
    );
  readonly collectionSlots$: Observable<Option<GenericCollection>[]> =
    this.select(
      this.collections$,
      this.select(({ collectionSlotIds }) => collectionSlotIds),
      (collections, collectionSlotIds) =>
        collectionSlotIds.map((collectionId) => {
          if (collectionId === null) {
            return null;
          }

          return (
            collections?.find((collection) => collection.id === collectionId) ??
            null
          );
        })
    );
  readonly selectedInstruction$: Observable<Option<GenericInstruction>> =
    this.select(
      this.instructions$,
      this.select(({ selectedInstructionId }) => selectedInstructionId),
      (instructions, selectedInstructionId) => {
        if (instructions === null || selectedInstructionId === null) {
          return null;
        }

        return (
          instructions?.find(
            (instruction) => instruction.id === selectedInstructionId
          ) ?? null
        );
      }
    );
  readonly selectedCollection$: Observable<Option<GenericCollection>> =
    this.select(
      this.collections$,
      this.select(({ selectedCollectionId }) => selectedCollectionId),
      (collections, selectedCollectionId) => {
        if (collections === null || selectedCollectionId === null) {
          return null;
        }

        return (
          collections?.find(
            (collection) => collection.id === selectedCollectionId
          ) ?? null
        );
      }
    );

  readonly setWorkspaceId = this.updater<Option<string>>(
    (state, workspaceId) => ({
      ...state,
      workspaceId,
    })
  );

  readonly setCurrentApplicationId = this.updater<Option<string>>(
    (state, currentApplicationId) => ({
      ...state,
      currentApplicationId,
    })
  );

  readonly setSelectedTaskId = this.updater<Option<string>>(
    (state, selectedTaskId) => ({
      ...state,
      selectedTaskId,
      selectedDocumentId: null,
    })
  );

  readonly setSelectedDocumentId = this.updater<Option<string>>(
    (state, selectedDocumentId) => ({
      ...state,
      selectedDocumentId,
      selectedTaskId: null,
    })
  );

  readonly setSelectedCollectionId = this.updater<Option<string>>(
    (state, selectedCollectionId) => ({
      ...state,
      selectedCollectionId,
    })
  );

  readonly setSelectedInstructionId = this.updater<Option<string>>(
    (state, selectedInstructionId) => ({
      ...state,
      selectedInstructionId,
    })
  );

  readonly setActiveCollectionId = this.updater<Option<string>>(
    (state, activeCollectionId) => ({
      ...state,
      activeCollectionId,
      activeInstructionId: null,
    })
  );

  readonly setCollectionSlotId = this.updater<{
    index: number;
    collectionId: Option<string>;
  }>((state, { index, collectionId }) => {
    return {
      ...state,
      collectionSlotIds: state.collectionSlotIds.map((id, i) =>
        i === index ? collectionId : id
      ),
    };
  });

  readonly swapCollectionSlotIds = this.updater<{
    previousIndex: number;
    newIndex: number;
  }>((state, { previousIndex, newIndex }) => {
    const collectionSlotIds = [...state.collectionSlotIds];
    const temp = collectionSlotIds[newIndex];
    collectionSlotIds[newIndex] = collectionSlotIds[previousIndex];
    collectionSlotIds[previousIndex] = temp;

    return {
      ...state,
      collectionSlotIds,
    };
  });

  readonly setActiveInstructionId = this.updater<Option<string>>(
    (state, activeInstructionId) => ({
      ...state,
      activeInstructionId,
      activeCollectionId: null,
    })
  );

  readonly setInstructionSlotId = this.updater<{
    index: number;
    instructionId: Option<string>;
  }>((state, { index, instructionId }) => {
    return {
      ...state,
      instructionSlotIds: state.instructionSlotIds.map((id, i) =>
        i === index ? instructionId : id
      ),
    };
  });

  readonly swapInstructionSlotIds = this.updater<{
    previousIndex: number;
    newIndex: number;
  }>((state, { previousIndex, newIndex }) => {
    const instructionSlotIds = [...state.instructionSlotIds];
    const temp = instructionSlotIds[newIndex];
    instructionSlotIds[newIndex] = instructionSlotIds[previousIndex];
    instructionSlotIds[previousIndex] = temp;

    return {
      ...state,
      instructionSlotIds,
    };
  });

  private readonly _loadWorkspace$ = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (workspaceId === null) {
        return EMPTY;
      }

      return combineLatest([
        this._workspaceApiService.getWorkspace(workspaceId),
        this._workspaceApiService.getWorkspaceApplicationIds(workspaceId),
      ]).pipe(
        tapResponse(
          ([workspace, applicationIds]) =>
            this.patchState({
              workspace: {
                id: workspaceId,
                name: workspace.name,
                applicationIds,
              },
            }),
          (error) => this._handleError(error)
        )
      );
    })
  );

  private readonly _loadApplications$ = this.effect<Option<string[]>>(
    switchMap((applicationIds) => {
      if (applicationIds === null) {
        return EMPTY;
      }

      return combineLatest(
        applicationIds.map((applicationId) =>
          combineLatest([
            this._applicationApiService.getApplication(applicationId),
            this._applicationApiService.getApplicationInstructionIds(
              applicationId
            ),
            this._applicationApiService.getApplicationCollectionIds(
              applicationId
            ),
          ]).pipe(
            map(([application, instructionIds, collectionIds]) => ({
              id: applicationId,
              name: application.name,
              workspaceId: application.workspaceId,
              instructionIds,
              collectionIds,
            }))
          )
        )
      ).pipe(
        tapResponse(
          (applications) =>
            this.patchState({
              applications,
            }),
          (error) => this._handleError(error)
        )
      );
    })
  );

  private readonly _loadCurrentApplicationInstructions$ = this.effect<
    Option<InstructionDto[]>
  >(
    switchMap((instructions) => {
      if (instructions === null) {
        return EMPTY;
      }

      return combineLatest(
        instructions.map((instruction) =>
          combineLatest([
            this._instructionApiService.getInstructionDocuments(instruction.id),
            this._instructionApiService.getInstructionTasks(instruction.id),
          ]).pipe(
            map(([documents, tasks]) => ({
              id: instruction.id,
              name: instruction.name,
              documents: instruction.documentsOrder.reduce(
                (orderedDocuments: DocumentDto[], documentId: string) => {
                  const documentFound =
                    documents.find((document) => document.id === documentId) ??
                    null;

                  if (documentFound === null) {
                    return orderedDocuments;
                  }

                  return [...orderedDocuments, documentFound];
                },
                []
              ),
              tasks: instruction.tasksOrder.reduce(
                (orderedTasks: TaskDto[], taskId: string) => {
                  const taskFound =
                    tasks.find((task) => task.id === taskId) ?? null;

                  if (taskFound === null) {
                    return orderedTasks;
                  }

                  return [...orderedTasks, taskFound];
                },
                []
              ),
            }))
          )
        )
      ).pipe(
        tapResponse(
          (currentApplicationInstructions) =>
            this.patchState({
              currentApplicationInstructions,
            }),
          (error) => this._handleError(error)
        )
      );
    })
  );

  private readonly _loadWorkspaceInstructions$ = this.effect<Option<string[]>>(
    switchMap((instructionIds) => {
      if (instructionIds === null) {
        return EMPTY;
      }

      return this._instructionApiService.getInstructions(instructionIds).pipe(
        tapResponse(
          (workspaceInstructions) =>
            this.patchState({
              workspaceInstructions,
            }),
          (error) => this._handleError(error)
        )
      );
    })
  );

  private readonly _loadWorkspaceCollections$ = this.effect<Option<string[]>>(
    switchMap((collectionIds) => {
      if (collectionIds === null) {
        return EMPTY;
      }

      return this._collectionApiService.getCollections(collectionIds).pipe(
        tapResponse(
          (workspaceCollections) =>
            this.patchState({
              workspaceCollections,
            }),
          (error) => this._handleError(error)
        )
      );
    })
  );

  constructor() {
    super(initialState);
  }

  ngrxOnStoreInit() {
    this._loadWorkspace$(this.workspaceId$);
    this._loadApplications$(
      this.select(
        this.workspace$,
        (workspace) => workspace?.applicationIds ?? null
      )
    );
    this._loadCurrentApplicationInstructions$(
      this.select(
        this.currentApplication$,
        (application) => application?.instructions ?? null
      )
    );
    this._loadWorkspaceCollections$(
      this.select(
        this.workspace$,
        this.applications$,
        (workspace, applications) => {
          if (workspace === null) {
            return [];
          }

          return workspace.applicationIds.reduce<string[]>(
            (collectionIds, applicationId) => {
              const application =
                applications?.find(({ id }) => id === applicationId) ?? null;

              if (application === null) {
                return collectionIds;
              }

              return [
                ...new Set([...collectionIds, ...application.collectionIds]),
              ];
            },
            []
          );
        }
      )
    );
    this._loadWorkspaceInstructions$(
      this.select(
        this.workspace$,
        this.applications$,
        (workspace, applications) => {
          if (workspace === null) {
            return [];
          }

          return workspace.applicationIds.reduce<string[]>(
            (instructionIds, applicationId) => {
              const application =
                applications?.find(({ id }) => id === applicationId) ?? null;

              if (application === null) {
                return instructionIds;
              }

              return [
                ...new Set([...instructionIds, ...application.instructionIds]),
              ];
            },
            []
          );
        }
      )
    );
  }

  private _handleError(error: unknown) {
    console.log(error);
  }
}
