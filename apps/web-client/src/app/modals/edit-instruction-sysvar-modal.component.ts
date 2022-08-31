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
import { v4 as uuid } from 'uuid';
import { Entity, Option } from '../utils';

export type InstructionSysvar = Entity<{
  name: string;
}>;

export interface EditInstructionSysvarData {
  instructionSysvar: Option<InstructionSysvar>;
}

export type EditInstructionSysvarSubmitPayload = InstructionSysvar;

@Directive({ selector: '[pgEditInstructionSysvarModal]', standalone: true })
export class EditInstructionSysvarModalDirective {
  private readonly _dialog = inject(Dialog);

  @Input() pgInstructionSysvar: Option<InstructionSysvar> = null;

  @Output() pgCreateInstructionSysvar =
    new EventEmitter<EditInstructionSysvarSubmitPayload>();
  @Output() pgUpdateInstructionSysvar =
    new EventEmitter<EditInstructionSysvarSubmitPayload>();
  @Output() pgOpenModal = new EventEmitter();
  @Output() pgCloseModal = new EventEmitter();

  @HostListener('click', []) onClick() {
    this.pgOpenModal.emit();

    this._dialog
      .open<
        EditInstructionSysvarSubmitPayload,
        EditInstructionSysvarData,
        EditInstructionSysvarModalComponent
      >(EditInstructionSysvarModalComponent, {
        data: {
          instructionSysvar: this.pgInstructionSysvar,
        },
      })
      .closed.subscribe((instructionSysvarData) => {
        this.pgCloseModal.emit();

        if (instructionSysvarData !== undefined) {
          if (this.pgInstructionSysvar === null) {
            this.pgCreateInstructionSysvar.emit(instructionSysvarData);
          } else {
            this.pgUpdateInstructionSysvar.emit(instructionSysvarData);
          }
        }
      });
  }
}

@Component({
  selector: 'pg-edit-instruction-sysvar-modal',
  template: `
    <div class="px-4 pt-8 pb-4 bg-white shadow-xl relative">
      <button
        class="absolute top-2 right-2 rounded-full border border-black leading-none w-6 h-6"
        (click)="onClose()"
      >
        x
      </button>

      <h1 class="text-center text-xl mb-4">
        {{ sysvar === null ? 'Create' : 'Update' }} sysvar
      </h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div>
          <label class="block" for="sysvar-id-input">Sysvar ID</label>
          <input
            class="block border-b-2 border-black"
            id="sysvar-id-input"
            type="text"
            formControlName="id"
            [readonly]="sysvar !== null"
          />
          <p *ngIf="sysvar === null">
            Hint: The ID cannot be changed afterwards.
          </p>
          <button
            *ngIf="sysvar === null"
            type="button"
            (click)="idControl.setValue(onGenerateId())"
          >
            Generate
          </button>
        </div>

        <div>
          <label class="block" for="sysvar-name-input"> Sysvar name </label>
          <input
            class="block border-b-2 border-black"
            id="sysvar-name-input"
            type="text"
            formControlName="name"
          />
        </div>

        <div class="flex justify-center items-center mt-4">
          <button type="submit" class="px-4 py-2 border-blue-500 border">
            {{ sysvar === null ? 'Send' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class EditInstructionSysvarModalComponent {
  private readonly _dialogRef =
    inject<
      DialogRef<
        EditInstructionSysvarSubmitPayload,
        EditInstructionSysvarModalComponent
      >
    >(DialogRef);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _data = inject<EditInstructionSysvarData>(DIALOG_DATA);

  readonly sysvar = this._data.instructionSysvar;
  readonly form = this._formBuilder.group({
    id: this._formBuilder.control<string>(this.sysvar?.id ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    name: this._formBuilder.control<string>(this.sysvar?.name ?? '', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  get idControl() {
    return this.form.get('id') as FormControl<string>;
  }

  get nameControl() {
    return this.form.get('name') as FormControl<string>;
  }

  onSubmit() {
    if (this.form.valid) {
      const id = this.idControl.value;
      const name = this.nameControl.value;

      this._dialogRef.close({
        id,
        name,
      });
    }
  }

  onClose() {
    this._dialogRef.close();
  }

  onGenerateId() {
    return uuid();
  }
}
