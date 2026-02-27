/**
 * Default request bodies for reprint / consignment API.
 * Replace placeholders (e.g. CONSIGNMENT_ID, LABEL_FORMAT) as needed.
 */

export const DEFAULT_REST_JSON = `{
  "consignmentId": "CONSIGNMENT_ID",
  "labelFormat": "LABEL_FORMAT"
}
`.trim()

export const DEFAULT_SOAP_XML = `<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="urn:DeliveryManager/services" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">
   <soapenv:Header/>
   <soapenv:Body>
      <ser:createPaperworkForConsignments soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
         <consignmentCodes xsi:type="ser:ArrayOf_soapenc_string" soapenc:arrayType="soapenc:string[]">
         <item>DMC1JY8Y88IY</item>
        </consignmentCodes>
         <parameters xsi:type="ser:ArrayOf_tns1_Property" soapenc:arrayType="typ:Property[]" xmlns:typ="urn:DeliveryManager/types">
            <item>
               <propertyName>type</propertyName>
               <propertyValue>all</propertyValue>
            </item>
            <item>
               <propertyName>format</propertyName>
               <propertyValue>zpl</propertyValue>
            </item>
            <item>
               <propertyName>dpi</propertyName>
               <propertyValue>300</propertyValue>
            </item>
            <item>
               <propertyName>dimension</propertyName>
               <propertyValue>6x4</propertyValue>
            </item>
         </parameters>
      </ser:createPaperworkForConsignments>
   </soapenv:Body>
</soapenv:Envelope>`.trim()
