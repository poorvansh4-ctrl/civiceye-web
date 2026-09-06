"use client";

import React, { useState, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { VideoRecorder } from "@/components/video-recorder";
import { IssueCategoryCard } from "@/components/issue-category-card";
import { AIAnalysisStep } from "@/components/ai-analysis-step";
import { SuccessScreen } from "@/components/success-screen";
import { EvidenceAnalysisCard } from "@/components/evidence-analysis-card";
import { DuplicateCheckCard } from "@/components/duplicate-check-card";
import { CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin,
  Video as VideoIcon,
  Loader2,
  Sparkles,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { useGeolocation } from "@/hooks/use-geolocation";
import { createClient } from "@/lib/supabase/client";
import { analyzeComplaint, AIAnalysisError, type AuthenticityStatus } from "@/lib/api";
import { useRouter } from "next/navigation";

type SubmissionState =
  | "form"
  | "analyzing"
  | "result"
  | "submitting"
  | "success";

const CATEGORY_TO_DB: Record<string, string> = {
  "Pothole": "pothole",
  "Garbage": "garbage",
  "Broken Streetlight": "streetlight",
  "Water Leakage": "water_leakage",
  "Road Damage": "road_damage",
  "Open Drain": "drainage",
  "Other": "other",
};

const DB_TO_CATEGORY: Record<string, string> = {
  pothole: "Pothole",
  garbage: "Garbage",
  streetlight: "Broken Streetlight",
  water_leakage: "Water Leakage",
  road_damage: "Road Damage",
  drainage: "Open Drain",
  other: "Other",
};

export default function ReportPage() {
  const router = useRouter();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [submissionState, setSubmissionState] = useState<SubmissionState>("form");
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisResult, setAnalysisResult] =
    useState<import("@/lib/api").AIAnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [submittedComplaintId, setSubmittedComplaintId] = useState<string>("");
  const [submittedComplaintNumber, setSubmittedComplaintNumber] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [analyzingLoading, setAnalyzingLoading] = useState(false);
  const [submittingLoading, setSubmittingLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // Synchronous re-entrancy guard against double-clicks / Strict Mode
  // double-invocation. We MUST set this BEFORE any await so a fast
  // double-click cannot issue two /analyze requests.
  const analyzeInFlightRef = useRef(false);

  const {
    latitude,
    longitude,
    address: detectedAddress,
    loading: locationLoading,
    error: locationError,
    detectLocation,
    resetLocation,
  } = useGeolocation(true);

  React.useEffect(() => {
    if (latitude && longitude) {
      if (!location) {
        queueMicrotask(() => {
          setLocation(detectedAddress || `Location detected`);
        });
      }
    }
  }, [latitude, longitude, detectedAddress, location]);

  React.useEffect(() => {
    if (locationError) {
      toast.error(locationError);
    }
  }, [locationError]);

  const handleLocationDetect = () => {
    detectLocation();
  };

  const handleVideoReady = (file: File, previewUrl: string) => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(file);
    setVideoPreviewUrl(previewUrl);
    console.info(
      `[CivicEye] handleVideoReady: file=%s type=%s size=%sMB`,
      file.name,
      file.type,
      (file.size / 1024 / 1024).toFixed(2)
    );
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.src = previewUrl;
    probe.onloadedmetadata = () => {
      const d = probe.duration;
      if (Number.isFinite(d) && d > 0) {
        setVideoDurationSeconds(d);
      } else {
        setVideoDurationSeconds(null);
      }
      probe.removeAttribute("src");
      probe.load();
    };
    probe.onerror = () => setVideoDurationSeconds(null);
  };

  const hasCoordinates = latitude !== null && longitude !== null;

  const isFormValid =
    videoFile && category && latitude !== null && longitude !== null;

  const analysisSteps = [
    { label: "Uploading evidence video...", id: 1 },
    { label: "AI Vision Analysis...", id: 2 },
    { label: "Authenticity check...", id: 3 },
    { label: "Duplicate detection...", id: 4 },
    { label: "Priority calculation...", id: 5 },
    { label: "Analysis complete", id: 6 },
  ];

  const handleAnalyze = async () => {
    if (!isFormValid) {
      toast.error(
        "Please record a video, choose a category, and allow location access before analyzing."
      );
      return;
    }
    if (!videoFile) {
      toast.error("Please record a short video of the issue first.");
      return;
    }
    if (latitude === null || longitude === null) {
      toast.error("Real location is required. Please allow location access.");
      return;
    }
    // Synchronous re-entrancy guard. Set BEFORE the first await so a
    // double-click (or a Strict-Mode-driven re-render) cannot fire
    // /analyze twice.
    if (analyzeInFlightRef.current || analyzingLoading) {
      return;
    }
    analyzeInFlightRef.current = true;

    setAnalyzingLoading(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setSubmissionState("analyzing");
    setCurrentStep(1);

    const stepTimers = [600, 1500, 2400, 3400, 4400, 5200, 6000];
    const stepTimeoutIds: number[] = [];
    stepTimers.forEach((delay, index) => {
      stepTimeoutIds.push(
        window.setTimeout(() => setCurrentStep(index + 2), delay)
      );
    });

    try {
      const result = await analyzeComplaint({
        video: videoFile,
        videoContentType: videoFile.type,
        description,
        category: CATEGORY_TO_DB[category] || "other",
        latitude,
        longitude,
        locationName: detectedAddress || location || null,
      });

      setAnalysisResult(result);
      setSubmissionState("result");
      toast.success("Analysis complete");
    } catch (err) {
      let message: string;
      if (err instanceof AIAnalysisError) {
        // Prefer the structured error code (mapped by the backend) so
        // we can show a precise, user-friendly message. Per the
        // quota-handling spec, the 429 case must say "AI analysis quota
        // is temporarily unavailable. Please try again later." and
        // MUST NOT auto-retry.
        switch (err.code) {
          case "GEMINI_QUOTA_EXHAUSTED":
            message =
              "AI analysis quota is temporarily unavailable. Please try again later.";
            break;
          case "ANALYSIS_IN_PROGRESS":
            message =
              err.message ||
              "An AI analysis is already in progress for this complaint. Please wait for it to finish.";
            break;
          case "AI_TIMEOUT":
          case "GEMINI_SERVER_ERROR":
          case "GEMINI_MODEL_UNAVAILABLE":
          case "AI_UNAVAILABLE":
            message =
              err.message ||
              "The AI service is temporarily unavailable. Please try again later.";
            break;
          case "GEMINI_INVALID_REQUEST":
            message =
              err.message ||
              "The AI rejected the request as invalid. Please retake the video and try again.";
            break;
          case "AI_PROVIDER_NOT_CONFIGURED":
            message = "AI provider is not configured on the server.";
            break;
          default:
            if (err.status === 429) {
              message =
                "AI analysis quota is temporarily unavailable. Please try again later.";
            } else if (err.status === 409) {
              message =
                err.message ||
                "An AI analysis is already in progress for this complaint.";
            } else if (err.status === 503) {
              message = "AI provider is not configured. The backend returned 503.";
            } else if (err.status === 504) {
              message =
                err.message ||
                "The AI analysis request timed out. Please try again with a shorter video.";
            } else if (err.status === 502) {
              message =
                err.message ||
                "The AI backend is unreachable. Make sure the FastAPI server is running.";
            } else if (err.status === 400) {
              message = err.message || "The backend rejected the request.";
            } else if (err.status === 413) {
              message =
                err.message ||
                "The video is too large. Please record a shorter video (5–10 seconds).";
            } else if (err.status === 0) {
              message = err.message || "No evidence was attached.";
            } else {
              message = err.message || "AI analysis service is currently unavailable.";
            }
        }
        // Log the upstream message in the browser console for debugging
        // — but never re-trigger the request.
        if (err.upstream) {
          console.warn(
            `[CivicEye] /analyze ${err.status} ${err.code ?? "?"}: ${err.upstream}`
          );
        }
      } else if (err instanceof Error) {
        // The browser-side fetch failed (e.g. "Load failed" on Safari,
        // "Failed to fetch" on Chrome/Firefox). This means the request
        // never reached the Next.js proxy at all.
        const lower = err.message.toLowerCase();
        if (
          err.name === "TypeError" &&
          (lower.includes("fetch") ||
            lower.includes("load failed") ||
            lower.includes("network"))
        ) {
          message =
            "AI backend is unreachable. Verify NEXT_PUBLIC_API_URL is set correctly and the backend is reachable from this network.";
        } else {
          message = err.message || "AI analysis service is currently unavailable.";
        }
      } else {
        message = "AI analysis service is currently unavailable.";
      }
      console.error("[CivicEye] /analyze failed:", err);
      setAnalysisError(message);
      setSubmissionState("form");
      toast.error(message);
    } finally {
      stepTimeoutIds.forEach((id) => window.clearTimeout(id));
      setAnalyzingLoading(false);
      analyzeInFlightRef.current = false;
    }
  };

  const handleSubmitComplaint = async () => {
    if (!analysisResult) {
      toast.error("Please run analysis first.");
      return;
    }
    if (latitude === null || longitude === null) {
      toast.error("Real location is required.");
      return;
    }
    if (!videoFile) {
      toast.error("Recorded video is missing. Please retake the video.");
      return;
    }

    // Validate video MIME and size before sending to Supabase/Gemini so
    // the user gets a clear error instead of a generic 502.
    const ALLOWED_MIME = [
      "video/webm",
      "video/mp4",
      "video/quicktime",
    ];
    const baseMime = (videoFile.type || "").split(";")[0].trim().toLowerCase();
    if (baseMime && !ALLOWED_MIME.includes(baseMime)) {
      toast.error(
        `Unsupported video format (${baseMime}). Allowed: ${ALLOWED_MIME.join(", ")}.`
      );
      return;
    }
    const MAX_BYTES = 25 * 1024 * 1024;
    if (videoFile.size > MAX_BYTES) {
      toast.error(
        `Video is too large (${(videoFile.size / 1024 / 1024).toFixed(1)} MB). Maximum is 25 MB.`
      );
      return;
    }

    setSubmittingLoading(true);
    setSubmitError(null);
    setSubmissionState("submitting");

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be signed in to submit a complaint.");
      }

      // 1) Upload the video to the `complaint-videos` bucket.
      const fileExt = (videoFile.name.split(".").pop() || "webm").toLowerCase();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("complaint-videos")
        .upload(fileName, videoFile, {
          upsert: false,
          contentType: videoFile.type || "video/webm",
        });

      if (uploadError) {
        throw new Error(`Video upload failed: ${uploadError.message}`);
      }

      const { data: publicUrl } = supabase.storage
        .from("complaint-videos")
        .getPublicUrl(fileName);

      const videoUrl = publicUrl.publicUrl;

      const finalAddress = location || detectedAddress || `Location detected`;

      // 2) Insert complaint row with all evidence + AI fields.
      //    We save the COMPLETE AI analysis result (returned by Gemini) both
      //    as a JSONB blob (`ai_analysis`) and as individual columns so it
      //    can be queried directly and displayed when the complaint is
      //    reopened — without ever calling Gemini again.
      //    Use .select() to receive the ACTUAL inserted row, including the
      //    database-generated UUID (`id`) and the trigger-generated
      //    `complaint_number`. We must use the real UUID for navigation,
      //    not the human-readable complaint number.
      const { data: insertedComplaint, error: insertError } = await supabase
        .from("complaints")
        .insert({
          user_id: user.id,
          category: CATEGORY_TO_DB[category] || "other",
          description,
          evidence_video_url: videoUrl,
          latitude,
          longitude,
          address: finalAddress,
          ai_confidence: analysisResult.ai_confidence,
          severity: analysisResult.severity,
          priority_score: analysisResult.priority_score,
          department: analysisResult.recommended_department,
          authenticity_status: analysisResult.authenticity_status,
          authenticity_confidence: analysisResult.authenticity_confidence,
          authenticity_explanation: analysisResult.authenticity_explanation,
          detected_issue: analysisResult.detected_issue,
          ai_explanation: analysisResult.explanation,
          is_duplicate: analysisResult.is_duplicate,
          duplicate_confidence: analysisResult.duplicate_confidence,
          duplicate_complaint_id: analysisResult.duplicate_complaint_id,
          duplicate_complaint_number: analysisResult.duplicate_complaint_number,
          duplicate_distance_meters: analysisResult.duplicate_distance_meters,
          duplicate_reason: analysisResult.duplicate_reason,
          ai_analysis: analysisResult as unknown,
          status: "submitted",
        })
        .select("id, complaint_number")
        .single();

      if (insertError) {
        throw new Error(`Failed to save complaint: ${insertError.message}`);
      }

      if (!insertedComplaint?.id) {
        throw new Error(
          "Complaint was inserted but Supabase did not return an id."
        );
      }

      // Store the REAL database UUID for navigation; keep the human-readable
      // complaint number only for display.
      const insertedId = insertedComplaint.id;
      const insertedNumber =
        insertedComplaint.complaint_number ?? insertedId;
      setSubmittedComplaintId(insertedId);
      setSubmittedComplaintNumber(insertedNumber);
      setSubmissionState("success");
      toast.success("Complaint submitted successfully.");

      // Navigate to the real Supabase complaint detail page so the user
      // can immediately track the report. We deliberately use `replace`
      // so the success screen isn't kept in browser history.
      router.replace(`/reports/${insertedId}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit complaint.";
      setSubmitError(message);
      setSubmissionState("result");
      toast.error(message);
    } finally {
      setSubmittingLoading(false);
    }
  };

  const resetForm = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setVideoDurationSeconds(null);
    setCategory("");
    setDescription("");
    setLocation("");
    resetLocation();
    setSubmissionState("form");
    setCurrentStep(0);
    setAnalysisResult(null);
    setAnalysisError(null);
    setSubmittedComplaintId("");
    setSubmittedComplaintNumber("");
    setSubmitError(null);
  };

  const displayLocation =
    location || detectedAddress || "Detecting your location...";
  const displayCoordinates =
    latitude !== null && longitude !== null
      ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      : "";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
      <Navbar />

      <main className="flex-1 py-6 sm:py-8 md:py-12 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto w-full min-w-0">
          {submissionState === "form" && (
            <div className="space-y-6 sm:space-y-8 animate-fade-in">
              <div className="px-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 leading-tight">
                  Report a Civic Issue
                </h1>
                <p className="text-slate-400 text-sm sm:text-base md:text-lg">
                  Record a short live video of the issue. Our AI will analyze
                  the problem and assess the evidence to help your city take
                  action faster.
                </p>
              </div>

              <form
                ref={formRef}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAnalyze();
                }}
                className="space-y-6 sm:space-y-8"
              >
                {/* Live Video Evidence */}
                <Card className="bg-[#1e2433] border-[#2e3548] overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <VideoIcon className="w-5 h-5 text-blue-400" />
                      Live Video Evidence
                    </CardTitle>
                    <CardDescription>
                      Record a 5–10 second clip showing the issue. The camera
                       only activates after you tap &quot;Open Camera&quot;.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VideoRecorder
                      onVideoReady={handleVideoReady}
                      maxSeconds={8}
                      autoCommit={false}
                    />
                    {videoFile && (
                      <p className="text-xs text-emerald-400 mt-3 text-center break-words px-2">
                        Evidence ready · {(videoFile.size / (1024 * 1024)).toFixed(2)} MB ·{" "}
                        {videoFile.type || "video/webm"}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Issue Category */}
                <Card className="bg-[#1e2433] border-[#2e3548]">
                  <CardHeader>
                    <CardTitle>Issue Category</CardTitle>
                    <CardDescription>
                      Select the type of civic issue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
                      {CATEGORIES.map((cat) => (
                        <IssueCategoryCard
                          key={cat}
                          category={cat}
                          selected={category === cat}
                          onClick={() => setCategory(cat)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card className="bg-[#1e2433] border-[#2e3548]">
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                    <CardDescription>
                      Provide details about the issue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Describe the issue in detail. For example: 'There is a large pothole approximately 2 feet wide on the main road. It has caused multiple vehicles to swerve and is a safety hazard.'"
                      className="min-h-[120px] sm:min-h-[140px] bg-[#0f1419] border-[#2e3548] resize-none text-sm sm:text-base"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </CardContent>
                </Card>

                {/* Location */}
                <Card className="bg-[#1e2433] border-[#2e3548]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-400" />
                      Location
                    </CardTitle>
                    <CardDescription>
                      Where is the issue located?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Input
                        placeholder="Enter street address or landmark"
                        className="bg-[#0f1419] border-[#2e3548] flex-1 min-w-0 w-full"
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleLocationDetect}
                        disabled={locationLoading}
                        className="w-full sm:w-auto border-[#2e3548] bg-[#0f1419] hover:bg-[#1e2433] shrink-0 min-h-[48px] h-11 sm:h-10"
                      >
                        {locationLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-400" />
                        ) : (
                          <Navigation className="w-4 h-4 mr-2 text-blue-400" />
                        )}
                        {locationLoading ? "Detecting..." : "Use Current Location"}
                      </Button>
                    </div>

                    {locationLoading && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                        <span className="text-sm text-blue-400">
                          Detecting your location...
                        </span>
                      </div>
                    )}

                    {hasCoordinates && !locationLoading && (
                      <div className="space-y-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 min-w-0">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-sm text-emerald-400 font-medium">
                            ✓ Location detected
                          </span>
                        </div>
                        {displayLocation &&
                          displayLocation !== "Detecting your location..." && (
                            <p className="text-sm text-white px-1 break-words">
                              📍 {displayLocation}
                            </p>
                          )}
                        {displayCoordinates && (
                          <p className="text-[11px] sm:text-xs text-slate-500 font-mono px-1 break-all">
                            {displayCoordinates}
                          </p>
                        )}
                      </div>
                    )}

                    {locationError && !locationLoading && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <span className="text-sm text-red-400 break-words">
                            {locationError}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleLocationDetect}
                          className="border-red-500/30 bg-transparent text-red-400 hover:bg-red-500/10 shrink-0 self-start sm:self-auto"
                        >
                          Try Again
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {analysisError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-red-400 break-words">{analysisError}</span>
                  </div>
                )}

                {/* Analyze Button — full width on mobile, ≥48px touch height */}
                <Button
                  type="submit"
                  className="w-full min-h-[48px] h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20"
                  disabled={!isFormValid || analyzingLoading}
                >
                  {analyzingLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin shrink-0" />
                      Analyzing evidence...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 shrink-0" />
                      Analyze Evidence
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {submissionState === "analyzing" && (
            <div className="max-w-md mx-auto animate-fade-in w-full">
              <Card className="bg-[#1e2433] border-[#2e3548] shadow-2xl">
                <CardHeader className="text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400 animate-spin" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">
                    Processing Evidence
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Uploading the video and running AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-4 sm:py-6">
                  <AIAnalysisStep
                    steps={analysisSteps}
                    currentStep={currentStep}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {(submissionState === "result" ||
            submissionState === "submitting") &&
            analysisResult && (
              <div className="space-y-5 sm:space-y-6 animate-fade-in">
                <EvidenceAnalysisCard
                  issueType={analysisResult.detected_issue}
                  confidence={analysisResult.ai_confidence}
                  severity={analysisResult.severity.toUpperCase()}
                  priorityScore={analysisResult.priority_score}
                  department={analysisResult.recommended_department}
                  reasons={[
                    analysisResult.explanation,
                    ...(analysisResult.authenticity_status === "suspicious"
                      ? [
                          "Manual verification recommended before routing to a department.",
                        ]
                      : []),
                  ]}
                  authenticityStatus={
                    analysisResult.authenticity_status as AuthenticityStatus
                  }
                  authenticityConfidence={
                    analysisResult.authenticity_confidence
                  }
                  authenticityExplanation={
                    analysisResult.authenticity_explanation
                  }
                />

                <DuplicateCheckCard
                  isDuplicate={analysisResult.is_duplicate}
                  duplicateConfidence={analysisResult.duplicate_confidence}
                  duplicateComplaintId={analysisResult.duplicate_complaint_id}
                  duplicateComplaintNumber={
                    analysisResult.duplicate_complaint_number
                  }
                  duplicateDistanceMeters={
                    analysisResult.duplicate_distance_meters
                  }
                  duplicateReason={analysisResult.duplicate_reason}
                  showSubmitAnyway={false}
                />

                {submitError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-red-400 break-words">{submitError}</span>
                  </div>
                )}

                <Card className="bg-[#1e2433] border-[#2e3548]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Final Evidence Summary
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Review the captured evidence before submitting your civic report.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0f1419] border border-[#2e3548] min-w-0">
                        <div className="p-2 rounded-lg bg-blue-500/10 shrink-0">
                          <VideoIcon className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500">Video Evidence</p>
                          <p className="font-medium text-white break-words">
                            {videoDurationSeconds
                              ? `✓ ${videoDurationSeconds.toFixed(1)} sec recorded`
                              : "✓ Recorded"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0f1419] border border-[#2e3548] min-w-0">
                        <div className="p-2 rounded-lg bg-purple-500/10 shrink-0">
                          <MapPin className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500">Location</p>
                          <p className="font-medium text-white break-words">
                            {displayLocation && displayLocation !== "Detecting your location..."
                              ? `📍 ${displayLocation}`
                              : "Location name unavailable"}
                          </p>
                          {latitude !== null && longitude !== null && (
                            <p className="text-[11px] sm:text-xs text-slate-500 font-mono mt-1 break-all">
                              {latitude.toFixed(6)}, {longitude.toFixed(6)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0f1419] border border-[#2e3548] min-w-0">
                        <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500">AI Detection</p>
                          <p className="font-medium text-white capitalize break-words">
                            {analysisResult.detected_issue}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0f1419] border border-[#2e3548] min-w-0">
                        <div className="p-2 rounded-lg bg-red-500/10 shrink-0">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500">Severity</p>
                          <p className="font-medium text-white capitalize break-words">
                            {analysisResult.severity}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0f1419] border border-[#2e3548] min-w-0">
                        <div className="p-2 rounded-lg bg-amber-500/10 shrink-0">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500">Priority Score</p>
                          <p className="font-medium text-white">
                            {analysisResult.priority_score}/100
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0f1419] border border-[#2e3548] min-w-0">
                        <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500">Authenticity</p>
                          <p className="font-medium text-white capitalize break-words">
                            {analysisResult.authenticity_status.replace(/_/g, " ")}
                            {" · "}
                            <span className="text-slate-400">
                              {analysisResult.authenticity_confidence}% confidence
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSubmissionState("form");
                      setAnalysisError(null);
                      setSubmitError(null);
                    }}
                     disabled={submittingLoading || analyzingLoading}
                     className="w-full sm:flex-1 min-h-[48px] h-12 sm:h-10 border-[#2e3548] bg-[#0f1419] hover:bg-[#1e2433]"
                   >
                     Back to Edit
                   </Button>
                   <Button
                     type="button"
                     onClick={handleSubmitComplaint}
                     disabled={submittingLoading || analyzingLoading}
                    className="w-full sm:flex-1 min-h-[48px] h-12 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    {submittingLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2 shrink-0" />
                        Submit Civic Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

          {submissionState === "success" && (
            <SuccessScreen
              complaintId={submittedComplaintNumber || submittedComplaintId}
              reportId={submittedComplaintId}
              issue={
                DB_TO_CATEGORY[
                  (analysisResult?.detected_issue ?? "")
                    .toString()
                    .toLowerCase()
                    .replace(/[^a-z_]/g, "")
                ] || category
              }
              location={displayLocation}
              priority={analysisResult?.priority_score || 0}
              department={
                analysisResult?.recommended_department || "Municipal Corporation"
              }
              status="Submitted"
              onReportAnother={resetForm}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
