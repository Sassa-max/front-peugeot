import { TypoProps } from "./chatBot";
import { ChatMessage } from "./chatMessage";

export interface retrievePrevMsgsProps {
  apiUrl: string;
  allPrevMessages: ChatMessage[];
  renderProductCard?: (props: { vehicle: any }) => React.ReactNode;
  renderCarDetailsInformation?: (props: {
    vehicle: any;
    onReserve: () => void;
    onAddToCart: () => void;
    onSubmit: () => void;
  }) => React.ReactNode;
  renderLeadForm?: (props: {
    leadFormDetails: {
      vehicleId: string;
      vehicleBrand?: string;
      vehicleModel?: string;
      vehiclePrice?: string;
      vehicleLeadType?: string;
      vehicleContactMethod?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      gender?: string;
      metaConstructor?: string;
      optinEmail?: string;
      optinSMS?: string;
      telephone?: string;
      appointmentDate?: string;
      appointmentHours?: string;
      message?: string;
    };
    onSubmit: () => void;
  }) => React.ReactNode;
  TypoComponent: React.ComponentType<TypoProps>;
}