import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import {
  Component,
  Directive,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ModalComponent } from '../../shared/components';
import {
  KeyboardListenerDirective,
  StopKeydownPropagationDirective,
} from '../../shared/directives';
import { generateId, isNull, Option } from '../../shared/utils';

export interface InstructionApplication {
  name: string;
}

export interface EditInstructionApplicationData {
  instructionApplication: Option<InstructionApplication>;
}

export type EditInstructionApplicationSubmit = InstructionApplication;

export const openEditInstructionApplicationModal = (
  dialog: Dialog,
  data: EditInstructionApplicationData
) =>
  dialog.open<
    EditInstructionApplicationSubmit,
    EditInstructionApplicationData,
    EditInstructionApplicationModalComponent
  >(EditInstructionApplicationModalComponent, {
    data,
  });

@Directive({
  selector: '[pgUpdateInstructionApplicationModal]',
  standalone: true,
})
export class UpdateInstructionApplicationModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgInstructionApplication: Option<InstructionApplication> = null;

  @Output() pgUpdateInstructionApplication =
    new EventEmitter<EditInstructionApplicationSubmit>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    if (isNull(this.pgInstructionApplication)) {
      throw new Error('pgInstructionApplication is missing.');
    }

    this.pgOpenModal.emit();

    openEditInstructionApplicationModal(this._dialog, {
      instructionApplication: this.pgInstructionApplication,
    }).closed.subscribe((instructionApplicationData) => {
      this.pgCloseModal.emit();

      if (instructionApplicationData !== undefined) {
        this.pgUpdateInstructionApplication.emit(instructionApplicationData);
      }
    });
  }
}

@Component({
  selector: 'pg-edit-instruction-application-modal',
  template: `
    <pg-modal
      class="text-white min-w-[400px] min-h-[300px]"
      pgStopKeydownPropagation
      pgKeyboardListener
      (keydown)="onKeyDown($event)"
      (pgCloseModal)="onClose()"
    >
      <div class="flex justify-between w-full">
        <h1 class="text-center text-3xl mb-4 bp-font-game-title uppercase">
          {{ instructionApplication === null ? 'Create' : 'Update' }}
          application
        </h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="overflow-y-auto">
        <div class="mb-4">
          <label
            class="block bp-font-game text-xl"
            for="instruction-application-name-input"
          >
            Application name
          </label>
          <input
            class="bp-input-futuristic p-4 outline-0"
            id="instruction-application-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="flex justify-center items-center mt-10 mb-14">
          <button
            type="submit"
            class="bp-skin-moba-button text-black bp-font-game uppercase"
          >
            {{ instructionApplication === null ? 'Send' : 'Save' }}
          </button>
        </div>
      </form>
    </pg-modal>
  `,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StopKeydownPropagationDirective,
    KeyboardListenerDirective,
    ModalComponent,
  ],
})
export class EditInstructionApplicationModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        EditInstructionApplicationSubmit,
        EditInstructionApplicationModalComponent
      >
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditInstructionApplicationData>(DIALOG_DATA);

  readonly instructionApplication = this._data.instructionApplication;
  readonly form = this._formBuilder.group({
    name: this._formBuilder.control<string>(
      this.instructionApplication?.name ?? '',
      {
        validators: [Validators.required],
        nonNullable: true,
      }
    ),
  });

  get nameControl() {
    return this.form.get('name') as FormControl<string>;
  }

  onSubmit() {
    if (this.form.valid) {
      const name = this.nameControl.value;

      this._dialogRef.close({
        name,
      });
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this._dialogRef.close();
    }
  }

  onClose() {
    this._dialogRef.close();
  }

  onGenerateId() {
    return generateId();
  }
}
