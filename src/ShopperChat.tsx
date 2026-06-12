import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";

import { useOrchestratorAnswer } from "./hooks/useOrchestratorAnswer";
import { ChatUI } from "./components/ChatUI";
import { LAIonSidebar } from "./components/LAIonSidebar";
import { OrchestrationResultView } from "./components/OrchestrationResultView";
import { getResultsMarkdown } from "./utils/formatting";
import { Box, Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  ResponsiveSyncedLayout,
  useShopperGptLayoutPane,
} from "shoppergpt-layout";
import img1 from "./assets/img1.avif";
import img2 from "./assets/img2.avif";
import img3 from "./assets/img3.avif";
import img4 from "./assets/img4.avif";
import { Message } from "./types/chatBot";
import AccessoriesButton from "./components/Input/Button/AccessoriesButton";
import "./global.css";
import { ShopperChatProps } from "./types/shopperChat";
import { useChatInit } from "./hooks/useChatInit";
import { useLeadFormTracker } from "./hooks/useLeadFormTracker";
import { cartTracker } from "./utils/modules/cartTracker";
import { fetchVehicleDetails } from "./utils/modules/getVehicleDetails";
import { Vehicle } from "./types/vehicle";
import { logInteraction } from "./utils/modules/logInteraction";
import { resolveApiUrl } from "./utils/apiConfig";
import { ChatSessionProvider, useChatSession } from "./hooks/useChatSession";

const LAYOUT_THEME = {
  background: "#ffffff",
  surface: "#ffffff",
  divider: "rgba(0,0,0,0.12)",
  handle: "rgba(0,0,0,0.35)",
} as const;

export const ShopperChat = ({
  renderProductCard,
  renderCarDetailsInformation,
  renderCarouselMobile,
  renderLeadForm,
  apiUrl,
  hostEnv,
  TypoComponent,
  getRecaptchaScore,
}: ShopperChatProps) => {
  const resolvedApiUrl =
    apiUrl || hostEnv
      ? resolveApiUrl(hostEnv, apiUrl)
      : import.meta.env.VITE_API_URL || "http://localhost:8000";
  const [jwt, setJwt] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [recaptchaVerified, setRecaptchaVerified] = useState<boolean>(false);

  useChatInit({
    apiUrl: resolvedApiUrl,
    setJwt,
    jwt,
    setSessionId,
  });

  const initialMessage: Message = {
    id: uuidv4(),
    name: "Assistant LAION",
    object:
      "Bonjour et bienvenue sur l'assistant virtuel LAION. Comment puis-je vous aider\u00A0?",
  };
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [answer, setAnswer] = useState("");
  const [question, setQuestion] = useState("");
  const [currentView, setCurrentView] = useState<{
    type:
      | "welcome"
      | "searching"
      | "orchestration"
      | "carsList"
      | "carDetails"
      | "leadForm"
      | "extLink";
    progress?: string;
    markdown?: string;
    vehicles?: any[];
    vehicle?: any;
    leadFormDetails?: any;
    viewId?: string;
    linkCategory?: string;
    linkUrl?: string;
    buttonText?: string;
  } | null>({ type: "welcome" });
  const [lastToolType, setLastToolType] = useState<string | undefined>("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [formSubType, setFormSubType] = useState<string>("");
  const [savedVehicleList, setSavedVehicleList] = useState<any>(null);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [wasACardClicked, setWasACardClicked] = useState<boolean>(false);
  const [wasGoBackButtonHit, setWasGoBackButtonHit] = useState<boolean>(false);
  const [finalMsgSent, setFinalMsgSent] = useState<boolean>(false);
  const [successForm, setSuccessForm] = useState(null);
  const {
    loading,
    error: orchestrationError,
    orchestrationProgress,
    orchestrationResult,
  } = useOrchestratorAnswer({
    setAnswer,
    question,
    apiUrl: resolvedApiUrl,
    setJwt,
    jwt,
    successForm,
    setSuccessForm,
  });
  const noOnGoBack = false;

  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || !orchestrationResult) {
      return;
    }

    const markdown = getResultsMarkdown(orchestrationResult);
    setCurrentView({
      type: "orchestration",
      markdown,
    });
  }, [loading, orchestrationResult]);

  useEffect(() => {
    if (orchestrationError) {
      console.error(orchestrationError);
    }
  }, [orchestrationError]);

  const { trackLead } = useLeadFormTracker({
    leadId: sessionId,
    carId: `${
      currentView?.leadFormDetails?.vehicle?.id || currentView?.vehicle?.id
    }`,
    formType:
      currentView?.leadFormDetails?.user?.vehicleLeadType || formSubType,
    apiUrl: resolvedApiUrl,
    jwt,
  });
  const handleReserve = useCallback(() => {
    cartTracker({
      leadId: sessionId,
      carId: `${currentView?.vehicle?.id}`,
      apiUrl: resolvedApiUrl,
      jwt,
    });
  }, [currentView?.vehicle?.id, jwt, resolvedApiUrl, sessionId]);

  const handleAddToCart = useCallback(() => {
    cartTracker({
      leadId: sessionId,
      carId: `${currentView?.vehicle?.id}`,
      apiUrl: resolvedApiUrl,
      jwt,
    });
  }, [currentView?.vehicle?.id, jwt, resolvedApiUrl, sessionId]);

  // Wrapper function to handle one-time reCAPTCHA verification
  const handleRecaptchaOnce = useCallback(async (): Promise<boolean> => {
    // If already verified, return true immediately
    if (hostEnv === "local") {
      return true;
    }
    if (recaptchaVerified) {
      return true;
    }
    // If no reCAPTCHA function provided, consider as verified
    if (!getRecaptchaScore) {
      console.log("No reCAPTCHA function provided, considering as verified");
      setRecaptchaVerified(true);
      return true;
    }
    try {
      const captchaResponse = await getRecaptchaScore();
      const passedCaptcha =
        captchaResponse?.success && (captchaResponse?.score ?? 0) >= 0.7;

      if (passedCaptcha) {
        setRecaptchaVerified(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("reCAPTCHA verification failed:", error);
      return false;
    }
  }, [getRecaptchaScore, hostEnv, recaptchaVerified]);

  const handleSubmit = useCallback(async (
    data?: { user: { subType: string } },
    success?: boolean,
  ) => {
    const captchaPassed = await handleRecaptchaOnce();
    if (success && captchaPassed) {
      setSuccessForm(true);
      if (data?.user?.subType) {
        setFormSubType(data.user.subType);
      }
      // Track the lead submission
      await trackLead();
    } else {
      setSuccessForm(false);
    }
    setCurrentView(null);
  }, [handleRecaptchaOnce, trackLead]);

  const handleGetDetails = useCallback(async (vehicle: any) => {
    try {
      setSavedVehicleList(currentView);
      setLastMessageId(messages[messages.length - 1].id);
      setWasACardClicked(true);
      setWasGoBackButtonHit(false);
      const res = await fetchVehicleDetails(
        resolvedApiUrl,
        jwt,
        vehicle.id,
        vehicle.internalType,
      );
      const vehicleDetails = res.data;
      await logInteraction(resolvedApiUrl, jwt, {
        event: "card_click",
        vehicleId: vehicleDetails.id.toString(),
        vehicleSummary: {
          brand: vehicleDetails.brand,
          model: vehicleDetails.model,
          year: vehicleDetails.year,
          km: vehicleDetails.kilometers,
          price: vehicleDetails.price,
        },
      });
      setLastToolType("carDetails");
      setCurrentView({
        type: "carDetails",
        vehicle: vehicleDetails,
      });
      if (boxRef.current) {
        boxRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error: any) {
      console.error("Failed to load vehicle details:", error.message);
    }
  }, [currentView, jwt, messages, resolvedApiUrl]);

  const handleGoBackToList = useCallback(async () => {
    setLastMessageId(messages[messages.length - 1].id);
    setWasACardClicked(false);
    setWasGoBackButtonHit(true);
    setLastToolType("carsList");
    setCurrentView(savedVehicleList);
    await logInteraction(resolvedApiUrl, jwt, {
      event: "go_back",
      vehicleList: savedVehicleList.vehicles.map((v: Vehicle) => ({
        brand: v.brand,
        model: v.model,
        year: new Date(v.dateVehicleFirstRegistered).getFullYear(),
        price: v.vehiclePriceIncTax,
        mileage: v.mileageFromOdometer,
        fuelType: v.fuelType,
        transmission: v.vehicleTransmission,
      })),
    });
  }, [jwt, messages, resolvedApiUrl, savedVehicleList]);

  const extComponents = useMemo(() => {
    if (currentView?.type === "carsList") {
      return renderCarouselMobile?.({
        vehicles: currentView.vehicles,
        onChangeComponent: handleGetDetails,
      });
    }

    if (currentView?.type === "carDetails") {
      return renderCarDetailsInformation?.({
        vehicle: currentView.vehicle,
        onOrderOnline: handleReserve,
        onAddToCart: handleAddToCart,
        onSubmit: handleSubmit,
        onGoBack: handleGoBackToList,
        showGoBackButton: !noOnGoBack,
      });
    }

    if (currentView?.type === "leadForm") {
      return (
        <Box height="100%" key={currentView?.viewId}>
          {renderLeadForm?.({
            leadFormDetails: currentView.leadFormDetails,
            onSubmit: handleSubmit,
          })}
        </Box>
      );
    }

    if (currentView?.type === "extLink") {
      return (
        <AccessoriesButton
          apiUrl={resolvedApiUrl}
          linkCategory={currentView?.linkCategory}
          linkUrl={currentView?.linkUrl}
          text={currentView?.buttonText}
          TypoComponent={TypoComponent}
        />
      );
    }

    return undefined;
  }, [
    currentView,
    handleAddToCart,
    handleGetDetails,
    handleGoBackToList,
    handleReserve,
    handleSubmit,
    noOnGoBack,
    renderCarDetailsInformation,
    renderCarouselMobile,
    renderLeadForm,
    resolvedApiUrl,
    TypoComponent,
  ]);

  const chatSessionValue = useMemo(
    () => ({
      answer,
      setAnswer,
      question,
      setQuestion,
      loading,
      orchestrationProgress,
      successForm,
      setSuccessForm,
      messages,
      setMessages,
      componentType: currentView?.type ?? "",
      extComponents,
      apiUrl: resolvedApiUrl,
      TypoComponent,
      wasACardClicked,
      lastMessageId,
      wasGoBackButtonHit,
      finalMsgSent,
      rightPartInteraction: wasACardClicked || wasGoBackButtonHit,
      handleRecaptchaOnce,
      boxRef,
      lastToolType,
      currentView,
      renderProductCard,
      renderCarouselMobile,
      renderCarDetailsInformation,
      renderLeadForm,
      handleGetDetails,
      handleReserve,
      handleAddToCart,
      handleSubmit,
      handleGoBackToList,
      noOnGoBack,
    }),
    [
      answer,
      question,
      loading,
      orchestrationProgress,
      successForm,
      messages,
      currentView,
      extComponents,
      resolvedApiUrl,
      TypoComponent,
      wasACardClicked,
      lastMessageId,
      wasGoBackButtonHit,
      finalMsgSent,
      handleRecaptchaOnce,
      lastToolType,
      renderProductCard,
      renderCarouselMobile,
      renderCarDetailsInformation,
      renderLeadForm,
      handleGetDetails,
      handleReserve,
      handleAddToCart,
      handleSubmit,
      handleGoBackToList,
    ],
  );

  return (
    <Box
      ref={chatContainerRef}
      sx={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "row",
      }}
    >
      <ChatSessionProvider value={chatSessionValue}>
        <LAIonSidebar />
        <ShopperSyncedLayout />
      </ChatSessionProvider>
    </Box>
  );
};

const ShopperSyncedLayout = React.memo(function ShopperSyncedLayout() {
  return (
    <ResponsiveSyncedLayout
      desktopMinWidthPx={1024}
      desktopDraggableDivider
      chat={<ShopperChatPane />}
      results={<ShopperResultsPane />}
      theme={LAYOUT_THEME}
      desktopInitialLeftRatio={0.4}
    />
  );
});

function ShopperChatPane() {
  const { showResultsInChat } = useShopperGptLayoutPane();
  const { extComponents } = useChatSession();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
      }}
    >
      <ChatUI
        externalComponents={showResultsInChat ? extComponents : undefined}
      />
    </Box>
  );
}

type WelcomeDashboardProps = {
  TypoComponent: ShopperChatProps["TypoComponent"];
};

function WelcomeDashboard({ TypoComponent }: WelcomeDashboardProps) {
  const cardActionSx = {
    position: "absolute" as const,
    right: 16,
    bottom: 16,
    textTransform: "uppercase" as const,
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    minWidth: "auto",
    p: 0,
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        bgcolor: "#fff",
        p: 2,
        boxSizing: "border-box",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          minHeight: { xs: 220, md: 603 },
          flexShrink: 0,
          backgroundImage: `url(${img1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: { xs: 20, md: 32 },
            left: { xs: 20, md: 32 },
            maxWidth: { xs: "80%", md: "50%" },
          }}
        >
          <TypoComponent
            component="h2"
            sx={{
              m: 0,
              color: "#fff",
              fontWeight: 700,
              fontSize: { xs: "1.75rem", md: "2.5rem" },
              lineHeight: 1.15,
            }}
          >
            The E-3008 plan has
            <br />
            been approved
            <br />
            discover it
          </TypoComponent>
        </Box>
        <Button
          sx={{
            position: "absolute",
            right: { xs: 16, md: 24 },
            bottom: { xs: 16, md: 24 },
            bgcolor: "#000",
            color: "#fff",
            borderRadius: 0,
            px: 2.5,
            py: 1,
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            "&:hover": { bgcolor: "#222" },
          }}
        >
          MORE DETAIL
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 2,
          flex: 1,
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            position: "relative",
            minHeight: { xs: 200, md: 200 },
            bgcolor: "#000",
            backgroundImage: `url(${img2})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            overflow: "hidden",
          }}
        >
          <TypoComponent
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.1rem",
              zIndex: 1,
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
            }}
          >
            Your weekly KPIs
          </TypoComponent>
          <Button
            endIcon={<DownloadIcon sx={{ fontSize: "1rem" }} />}
            sx={{
              ...cardActionSx,
              color: "#fff",
              "&:hover": { bgcolor: "transparent", opacity: 0.8 },
            }}
          >
            Download
          </Button>
        </Box>

        <Box
          sx={{
            position: "relative",
            minHeight: { xs: 200, md: 200 },
            backgroundImage: `url(${img3})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <TypoComponent
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.1rem",
              maxWidth: "70%",
              textShadow: "0 1px 4px rgba(0,0,0,0.4)",
            }}
          >
            New in the Photo gallery
          </TypoComponent>
          <Button
            endIcon={<VisibilityIcon sx={{ fontSize: "1rem" }} />}
            sx={{
              ...cardActionSx,
              bgcolor: "#000",
              color: "#fff",
              borderRadius: 0,
              px: 1.5,
              py: 0.75,
              "&:hover": { bgcolor: "#222" },
            }}
          >
            Discover
          </Button>
        </Box>

        <Box
          sx={{
            position: "relative",
            minHeight: { xs: 200, md: 200 },
            backgroundImage: `url(${img4})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            gridColumn: { xs: "1 / -1", sm: "auto" },
          }}
        >
          <Box
            sx={{ position: "absolute", top: 16, left: 16, maxWidth: "75%" }}
          >
            <TypoComponent
              sx={{
                color: "#fff",
                fontWeight: 700,
                fontSize: "1.1rem",
                textShadow: "0 1px 4px rgba(0,0,0,0.4)",
              }}
            >
              Events of the month
            </TypoComponent>
            <TypoComponent
              sx={{
                mt: 0.5,
                color: "#fff",
                fontWeight: 400,
                fontSize: "0.85rem",
                textShadow: "0 1px 4px rgba(0,0,0,0.4)",
              }}
            >
              PEUGEOT unveils Red Carpet
            </TypoComponent>
          </Box>
          <Button
            sx={{
              ...cardActionSx,
              color: "#fff",
              "&:hover": { bgcolor: "transparent", opacity: 0.8 },
            }}
          >
            More detail
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function ShopperResultsPane() {
  const { TypoComponent } = useChatSession();

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <AnimatePresence>
        (
        <motion.div
          key="welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ width: "100%", height: "100%" }}
        >
          <WelcomeDashboard TypoComponent={TypoComponent} />
        </motion.div>
        )
      </AnimatePresence>
    </Box>
  );
}
