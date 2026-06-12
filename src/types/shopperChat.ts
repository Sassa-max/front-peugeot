import { TypoProps } from "./chatBot";
import { RecaptchaResponse } from "./recaptcha";
import { Vehicle } from "./vehicle";
import { HostEnvironment } from "../utils/apiConfig";
export interface ShopperChatProps {
  renderProductCard?: (props: {
    vehicles: Vehicle[];
    onChangeComponent: (vehicle: any) => Promise<void>;
  }) => React.ReactNode;
  renderCarouselMobile?: (props: {
    vehicles: Vehicle[];
    onChangeComponent: (vehicle: any) => Promise<void>;
  }) => React.ReactNode;
  renderCarDetailsInformation?: (props: {
    vehicle: Vehicle;
    onOrderOnline: () => void;
    onAddToCart: () => void;
    onSubmit: (data?: { subType?: string } | any, success?: boolean) => void;
    onGoBack: () => void;
    showGoBackButton: boolean;
    // isLoading: boolean;
  }) => React.ReactNode;
  renderLeadForm?: (props: {
    leadFormDetails: {
      vehicle: Vehicle;
      user: {
        key?: string;
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
    };
    onSubmit: (data?: { subType?: string } | any, success?: boolean) => void;
  }) => React.ReactNode;
  apiUrl?: string;
  hostEnv?: HostEnvironment;
  TypoComponent: React.ComponentType<TypoProps>;
  getRecaptchaScore?: () => Promise<RecaptchaResponse>;
}
