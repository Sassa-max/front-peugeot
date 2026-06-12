import React from "react";
import { v4 as uuidv4 } from "uuid";
import AccessoriesButton from "../../components/Input/Button/AccessoriesButton";
import { Message } from "../../types/chatBot";
import { retrievePrevMsgsProps } from "../../types/retrievePrevMsgs";

export function retrievePrevMsgs({
  apiUrl,
  allPrevMessages,
  renderProductCard,
  renderCarDetailsInformation,
  renderLeadForm,
  TypoComponent,
}: retrievePrevMsgsProps): Message[] {
  const developerMap = new Map();

  // Step 1: Index all developer tool calls
  for (const msg of allPrevMessages) {
    if (msg.role === "developer" && msg.message_id.endsWith("_trace")) {
      const originalId = msg.message_id.replace("_trace", "");
      const match = msg.content.match(/Used function call: ([^\s]+) /);
      if (match) {
        developerMap.set(originalId, match[1]); // e.g. get_used_vehicles_for_sale
      }
    }
  }

  const formattedData = [];

  for (const msg of allPrevMessages) {
    if (msg.role === "developer") continue; // skip developer entries

    const base = {
      id: uuidv4(),
      name: msg.role === "user" ? "Vous" : "Assistant RRG",
      object: msg.content.replaceAll("__NEWLINE__", "\n"),
    };

    if (msg.role === "assistant" && msg.tool_output) {
      const toolName = developerMap.get(msg.message_id); // match by message_id
      const toolResults = msg.tool_output;

      let componentType = undefined;
      let components = undefined;

      if (toolName === "get_used_vehicles_for_sale") {
        componentType = "carsList";
        components = toolResults.map((v: any) =>
          renderProductCard ? renderProductCard({ vehicle: v }) : null
        );
      }

      if (toolName === "show_vehicle_details") {
        componentType = "carDetails";
        components = [
          renderCarDetailsInformation?.({
            vehicle: toolResults[0],
            onReserve: () => {},
            onAddToCart: () => {},
            onSubmit: () => {},
          }),
        ];
      }

      if (
        [
          "suggest_new_car_range_link",
          "suggest_new_renault_link",
          "suggest_new_dacia_link",
          "suggest_new_alpine_link",
          "suggest_workshop_booking_link",
          "suggest_accessories_link",
          "suggest_trade_in_link",
        ].includes(toolName)
      ) {
        componentType = "extLink";
        console.log("toolResults", toolResults);
        const { button_text, link_url } = toolResults?.[0] || {};
        components = [
          <AccessoriesButton
            apiUrl={apiUrl}
            key="ext"
            linkUrl={link_url}
            text={button_text}
            linkCategory={toolName}
            TypoComponent={TypoComponent}
          />,
        ];
      }

      if (toolName === "lead_form") {
        componentType = "leadForm";
        const toolData = toolResults[0] || {};
        const leadFormDetails = {
          vehicleId: toolData.vehicle_id ?? "",
          vehicleBrand: toolData.vehicle_brand ?? "",
          vehicleModel: toolData.vehicle_model ?? "",
          vehiclePrice: toolData.vehicle_price ?? "",
          vehicleLeadType: toolData.lead_type ?? "",
          vehicleContactMethod: toolData.contact_method ?? "",
          email: toolData.email ?? "",
          firstName: toolData.firstname ?? "",
          lastName: toolData.lastname ?? "",
          gender: toolData.gender ?? "",
          optinEmail: toolData.optin_email ?? "N",
          optinSMS: toolData.optin_sms ?? "N",
          telephone: toolData.telephone ?? "",
          appointmentDate: toolData.preferred_date ?? "",
          appointmentHours: toolData.preferred_time ?? "",
          message: toolData.message ?? "",
        };

        components = [
          renderLeadForm?.({
            leadFormDetails,
            onSubmit: () => {},
          }),
        ];
      }

      formattedData.push({
        ...base,
        componentType,
        components,
      });
    } else {
      // Regular user or assistant message
      formattedData.push(base);
    }
  }

  return formattedData;
}

export default retrievePrevMsgs;
