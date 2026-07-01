import React from "react";
import { Sparkles, Trash2, Zap } from "lucide-react";
import type {
  AppliedEditingTemplate,
  Clip,
  EditingTemplate,
  EditingTemplatePrimitive,
} from "@openreel/core";
import { LabeledSlider, Switch } from "@openreel/ui";
import {
  VideoEffectsSection,
  GreenScreenSection,
  PiPSection,
  MaskSection,
  MotionTrackingSection,
  NestedSequenceSection,
  AdjustmentLayerSection,
  BackgroundRemovalSection,
  BehindSubjectSection,
} from "../";
import { InspectorSection } from "../shell/InspectorSection";
import {
  EditingTemplateControls,
  mergeEditingTemplateControlValues,
} from "../../panels/EditingTemplateControls";
import { toast } from "../../../../stores/notification-store";
import { ParticleEffectsSectionWrapper } from "./ParticleEffectsSectionWrapper";

interface EffectsTabClip {
  duration: number;
  startTime: number;
}

export interface EffectsTabProps {
  clipId: string;
  clipType: string | null;
  selectedClip: EffectsTabClip | null;
  selectedTimelineClip: Clip | null;
  showVideoControls: boolean;
  showVideoEffects: boolean;
  showTextSection: boolean;
  appliedEditingTemplates: AppliedEditingTemplate[];
  getEditingTemplate: (templateId: string) => EditingTemplate | undefined;
  removeEditingTemplateApplication: (
    clipId: string,
    applicationId: string,
  ) => boolean;
  expandedRecipeApplicationId: string | null;
  setExpandedRecipeApplicationId: React.Dispatch<
    React.SetStateAction<string | null>
  >;
  recipeControlValues: Record<
    string,
    Record<string, EditingTemplatePrimitive>
  >;
  setRecipeControlValues: React.Dispatch<
    React.SetStateAction<
      Record<string, Record<string, EditingTemplatePrimitive>>
    >
  >;
  handleRecipeControlChange: (
    applicationId: string,
    controlId: string,
    value: EditingTemplatePrimitive,
  ) => void;
  handleToggleRecipeControls: (
    applicationId: string,
    templateId: string,
    controlValues?: Record<string, unknown>,
  ) => void;
  handleResetRecipeControls: (
    applicationId: string,
    templateId: string,
    controlValues?: Record<string, unknown>,
  ) => void;
  handleUpdateRecipeControls: (
    applicationId: string,
    templateId: string,
    controlValues?: Record<string, unknown>,
  ) => void;
  chromaKeyEnabled: boolean;
  keyColor: string;
  tolerance: number;
  handleChromaKeyToggle: (enabled: boolean) => void;
  handleKeyColorChange: (hexColor: string) => void;
  handleToleranceChange: (tolerance: number) => void;
}

export const EffectsTab: React.FC<EffectsTabProps> = ({
  clipId,
  clipType,
  selectedClip,
  selectedTimelineClip,
  showVideoControls,
  showVideoEffects,
  showTextSection,
  appliedEditingTemplates,
  getEditingTemplate,
  removeEditingTemplateApplication,
  expandedRecipeApplicationId,
  setExpandedRecipeApplicationId,
  recipeControlValues,
  setRecipeControlValues,
  handleRecipeControlChange,
  handleToggleRecipeControls,
  handleResetRecipeControls,
  handleUpdateRecipeControls,
  chromaKeyEnabled,
  keyColor,
  tolerance,
  handleChromaKeyToggle,
  handleKeyColorChange,
  handleToleranceChange,
}) => {
  return (
    <>
      {showVideoControls && selectedTimelineClip && (appliedEditingTemplates.length > 0 || (selectedTimelineClip.effects && selectedTimelineClip.effects.length > 0)) && (
        <InspectorSection
          title={`已应用 (${appliedEditingTemplates.length + (selectedTimelineClip.effects?.filter((e: { metadata?: { templateSource?: unknown } }) => !e.metadata?.templateSource).length || 0)})`}
          sectionId="applied-effects"
          defaultOpen={true}
        >
          <div className="space-y-2">
            {appliedEditingTemplates.map((application) => {
              const template = getEditingTemplate(application.templateId);
              const canEdit = Boolean(template?.controls?.length);
              const isExpanded =
                expandedRecipeApplicationId === application.applicationId;
              const currentControlValues = template
                ? recipeControlValues[application.applicationId] ||
                  mergeEditingTemplateControlValues(
                    template,
                    application.controlValues,
                  )
                : undefined;

              return (
                <div
                  key={application.applicationId}
                  className="rounded-lg border border-border bg-background-tertiary/70 px-2.5 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <Sparkles size={11} className="text-primary shrink-0" />
                      <p className="truncate text-[11px] font-medium text-text-primary">
                        {application.name}
                      </p>
                      <span className="text-[9px] text-text-muted capitalize shrink-0">
                        {application.category?.replace(/-/g, " ") || "recipe"}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {canEdit && (
                        <button
                          onClick={() =>
                            handleToggleRecipeControls(
                              application.applicationId,
                              application.templateId,
                              application.controlValues,
                            )
                          }
                          className={`h-6 px-1.5 rounded text-[9px] font-medium transition-colors ${
                            isExpanded
                              ? "bg-primary/15 text-primary"
                              : "text-text-muted hover:text-text-primary"
                          }`}
                        >
                          编辑
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const removed = removeEditingTemplateApplication(
                            selectedTimelineClip.id,
                            application.applicationId,
                          );
                          if (!removed) {
                            toast.error("无法移除配方", "无法从此片段移除该配方。");
                            return;
                          }
                          setRecipeControlValues((current) => {
                            const next = { ...current };
                            delete next[application.applicationId];
                            return next;
                          });
                          if (expandedRecipeApplicationId === application.applicationId) {
                            setExpandedRecipeApplicationId(null);
                          }
                        }}
                        className="h-6 px-1.5 rounded text-text-muted hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && template && currentControlValues && (
                    <div className="mt-2 space-y-3 rounded-lg border border-border/80 bg-background-secondary/80 p-2.5">
                      <EditingTemplateControls
                        template={template}
                        values={currentControlValues}
                        onChange={(controlId, value) =>
                          handleRecipeControlChange(
                            application.applicationId,
                            controlId,
                            value,
                          )
                        }
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() =>
                            handleResetRecipeControls(
                              application.applicationId,
                              application.templateId,
                              application.controlValues,
                            )
                          }
                          className="h-6 px-2.5 rounded border border-border text-[9px] font-medium text-text-secondary hover:text-text-primary transition-colors"
                        >
                          重置
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateRecipeControls(
                              application.applicationId,
                              application.templateId,
                              application.controlValues,
                            )
                          }
                          className="h-6 px-2.5 rounded bg-primary text-[9px] font-semibold text-black hover:bg-primary/85 transition-colors"
                        >
                          更新
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {selectedTimelineClip.effects
              ?.filter((e: { metadata?: { templateSource?: unknown } }) => !e.metadata?.templateSource)
              .map((effect: { id: string; type: string; enabled?: boolean }) => (
                <div
                  key={effect.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background-tertiary/70 px-2.5 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Zap size={11} className="text-amber-400 shrink-0" />
                    <p className="truncate text-[11px] font-medium text-text-primary capitalize">
                      {effect.type.replace(/-/g, " ")}
                    </p>
                  </div>
                  <span className={`text-[9px] font-medium ${effect.enabled !== false ? "text-green-400" : "text-text-muted"}`}>
                    {effect.enabled !== false ? "开" : "关"}
                  </span>
                </div>
              ))}
          </div>
        </InspectorSection>
      )}

      {clipType === "video" && (
        <InspectorSection title="背景移除" sectionId="background-removal" defaultOpen={false}>
          <BackgroundRemovalSection clipId={clipId} />
        </InspectorSection>
      )}

      {/* Particle Effects - Visual particle systems */}
      {(clipType === "video" ||
        clipType === "image" ||
        clipType === "text" ||
        clipType === "shape" ||
        clipType === "svg" ||
        clipType === "sticker") &&
        selectedClip && (
          <InspectorSection
            title="粒子特效"
            sectionId="particle-effects"
            defaultOpen={false}
          >
            <ParticleEffectsSectionWrapper
              clipId={clipId}
              clipDuration={selectedClip.duration}
              clipStartTime={selectedClip.startTime}
            />
          </InspectorSection>
        )}

      {/* Chroma Key - Using ChromaKeyEngine - Only for video/image */}
      {showVideoControls && (
        <InspectorSection title="色度键（绿幕）">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-secondary">
                启用
              </span>
              <Switch
                checked={chromaKeyEnabled}
                onCheckedChange={handleChromaKeyToggle}
              />
            </div>
            {chromaKeyEnabled && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-secondary">
                    键控颜色
                  </span>
                  <input
                    type="color"
                    value={keyColor}
                    onChange={(e) => handleKeyColorChange(e.target.value)}
                    className="w-8 h-6 rounded border border-border cursor-pointer"
                  />
                </div>
                <LabeledSlider
                  label="容差"
                  value={tolerance}
                  onChange={handleToleranceChange}
                  unit="%"
                />
              </>
            )}
          </div>
        </InspectorSection>
      )}

      {/* Motion Tracking - Using MotionTrackingEngine - Only for video/image */}
      {showVideoControls && (
        <InspectorSection title="运动跟踪" sectionId="motion-tracking">
          <MotionTrackingSection clipId={clipId} />
        </InspectorSection>
      )}

      {showVideoEffects && (
        <InspectorSection title="视频特效" sectionId="video-effects">
          <VideoEffectsSection clipId={clipId} />
        </InspectorSection>
      )}

      {showVideoEffects && (
        <InspectorSection
          title="绿幕抠像"
          sectionId="green-screen"
          defaultOpen={false}
        >
          <GreenScreenSection clipId={clipId} />
        </InspectorSection>
      )}

      {/* Picture-in-Picture Section */}
      {showVideoControls && (
        <InspectorSection
          title="画中画"
          sectionId="pip"
          defaultOpen={false}
        >
          <PiPSection clipId={clipId} />
        </InspectorSection>
      )}

      {showVideoControls && (
        <InspectorSection title="遮罩" sectionId="masking" defaultOpen={false}>
          <MaskSection clipId={clipId} />
        </InspectorSection>
      )}

      {showVideoControls && (
        <InspectorSection title="嵌套序列" defaultOpen={false}>
          <NestedSequenceSection clipId={clipId} />
        </InspectorSection>
      )}

      {showVideoControls && (
        <InspectorSection title="调整图层" defaultOpen={false}>
          <AdjustmentLayerSection clipId={clipId} />
        </InspectorSection>
      )}

      {showTextSection && (
        <InspectorSection
          title="文字置于主体后方"
          sectionId="text-behind-subject"
          defaultOpen={false}
        >
          <BehindSubjectSection clipId={clipId} />
        </InspectorSection>
      )}
    </>
  );
};
