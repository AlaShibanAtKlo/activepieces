import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { combineLatest, map, Observable, of, tap } from 'rxjs';
import {
  WebSocketService,
  fadeIn400msWithoutOut,
  initializedRun,
} from '@activepieces/ui/common';
import { Store } from '@ngrx/store';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import {
  FlowRunStatus,
  FlowRun,
  PopulatedFlow,
  TriggerType,
  WebsocketClientEvent,
  WebsocketServerEvent,
  isFlowStateTerminal,
} from '@activepieces/shared';
import {
  BuilderSelectors,
  TestRunBarComponent,
} from '@activepieces/ui/feature-builder-store';
import { filter, switchMap, take, takeWhile } from 'rxjs/operators';
import { canvasActions } from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-test-flow-widget',
  templateUrl: './test-flow-widget.component.html',
  styleUrls: ['./test-flow-widget.component.scss'],
  animations: [fadeIn400msWithoutOut],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestFlowWidgetComponent implements OnInit {
  triggerType = TriggerType;
  statusEnum = FlowRunStatus;
  instanceRunStatus$: Observable<undefined | FlowRunStatus>;
  isSaving$: Observable<boolean> = of(false);
  selectedFlow$: Observable<PopulatedFlow | undefined>;
  instanceRunStatusChecker$: Observable<FlowRun>;
  executeTest$: Observable<FlowRun | null>;
  shouldHideTestWidget$: Observable<boolean>;
  testRunSnackbar: MatSnackBarRef<TestRunBarComponent>;
  isTriggerTested$: Observable<boolean>;
  readonly testFlowText = $localize`Test flow`;
  readonly savingText = $localize`Saving...`;
  constructor(
    private store: Store,
    private snackbar: MatSnackBar,
    private websockService: WebSocketService
  ) {}

  ngOnInit() {
    this.isTriggerTested$ = this.store.select(
      BuilderSelectors.selectFlowTriggerIsTested
    );
    this.store.select(BuilderSelectors.selectIsSaving);
    this.setupSelectedFlowListener();
    this.selectedInstanceRunStatus();
    this.shouldHideTestWidget$ = combineLatest({
      saving: this.isSaving$,
      valid: this.store.select(BuilderSelectors.selectCurrentFlowValidity),
      isInReadOnlyMode: this.store.select(BuilderSelectors.selectReadOnly),
    }).pipe(
      map((res) => {
        return !res.valid || res.isInReadOnlyMode;
      })
    );
  }

  private setupSelectedFlowListener() {
    this.selectedFlow$ = this.store.select(BuilderSelectors.selectCurrentFlow);
  }

  selectedInstanceRunStatus() {
    this.instanceRunStatus$ = this.store.select(
      BuilderSelectors.selectCurrentFlowRunStatus
    );
  }

  testFlowButtonClicked(flow: PopulatedFlow) {
    this.executeTest(flow);
  }

  executeTest(flow: PopulatedFlow) {
    this.websockService.socket.emit(WebsocketServerEvent.TEST_FLOW_RUN, {
      flowVersionId: flow.version.id,
      projectId: flow.projectId,
    });

    this.executeTest$ = this.websockService.socket
      .fromEvent<FlowRun>(WebsocketClientEvent.TEST_FLOW_RUN_STARTED)
      .pipe(
        take(1),
        switchMap((flowRun) => {
          this.store.dispatch(
            canvasActions.setRun({
              run: flowRun ?? initializedRun,
            })
          );
          this.testRunSnackbar = this.snackbar.openFromComponent(
            TestRunBarComponent,
            {
              duration: undefined,
              data: {
                flowId: flow.id,
              },
            }
          );
          return this.websockService.socket
            .fromEvent<FlowRun>(WebsocketClientEvent.TEST_FLOW_RUN_PROGRESS)
            .pipe(
              filter((run) => run.id === flowRun.id),
              tap((run) => {
                console.log('FUCK ' + JSON.stringify(run));
                this.store.dispatch(
                  canvasActions.setRun({
                    run,
                  })
                );
              }),
              takeWhile((run) => !isFlowStateTerminal(run.status))
            );
        })
      );
  }
}
