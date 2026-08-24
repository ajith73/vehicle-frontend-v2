import acRepair from '../assets/specificServices/acRepair.png';
import accidentRecovery from '../assets/specificServices/accidentRecovery.png';
import airFilterReplacement from '../assets/specificServices/airFilterReplacement.png';
import batteryJumpstart from '../assets/specificServices/batteryJumpstart.png';
import batteryReplacement from '../assets/specificServices/batteryReplacement.png';
import brakeService from '../assets/specificServices/brakeService.png';
import chainAdjustment from '../assets/specificServices/chainAdjustment.png';
import clutchRepair from '../assets/specificServices/clutchRepair.png';
import coolantTopup from '../assets/specificServices/coolantTopup.png';
import electricalRepair from '../assets/specificServices/electricalRepair.png';
import emergencyBreakdown from '../assets/specificServices/emergencyBreakdown.png';
import engineDiagnostics from '../assets/specificServices/engineDiagnostics.png';
import engineRepair from '../assets/specificServices/engineRepair.png';
import fuelDelivery from '../assets/specificServices/fuelDelivery.png';
import generalService from '../assets/specificServices/generalService.png';
import jumpStart from '../assets/specificServices/jumpStart.png';
import keyLockoutAssistance from '../assets/specificServices/keyLockoutAssistance.png';
import oilChange from '../assets/specificServices/oilChange.png';
import punctureRepair from '../assets/specificServices/punctureRepair.png';
import sparkPlugReplacement from '../assets/specificServices/sparkPlugReplacement.png';
import suspensionRepair from '../assets/specificServices/suspensionRepair.png';
import towingServices from '../assets/specificServices/towingServices.png';
import tyreReplacement from '../assets/specificServices/tyreReplacement.png';
import wheelAlignment from '../assets/specificServices/wheelAlignment.png';
import wheelBalancing from '../assets/specificServices/wheelBalancing.png';

export const SERVICE_IMAGES: Record<string, string> = {
  'AC Repair': acRepair,
  'Accident Recovery': accidentRecovery,
  'Air Filter Replacement': airFilterReplacement,
  'Battery Jumpstart': batteryJumpstart,
  'Battery Replacement': batteryReplacement,
  'Brake Service': brakeService,
  'Chain Adjustment': chainAdjustment,
  'Clutch Repair': clutchRepair,
  'Coolant Top-up': coolantTopup,
  'Electrical Repair': electricalRepair,
  'Emergency Breakdown': emergencyBreakdown,
  'Engine Diagnostics': engineDiagnostics,
  'Engine Repair': engineRepair,
  'Fuel Delivery': fuelDelivery,
  'General Service': generalService,
  'Jump Start': jumpStart,
  'Key Lockout Assistance': keyLockoutAssistance,
  'Oil Change': oilChange,
  'Puncture Repair': punctureRepair,
  'Spark Plug Replacement': sparkPlugReplacement,
  'Suspension Repair': suspensionRepair,
  'Towing Services': towingServices,
  'Tyre Replacement': tyreReplacement,
  'Wheel Alignment': wheelAlignment,
  'Wheel Balancing': wheelBalancing
};

export const DEFAULT_SERVICE_IMAGE = generalService;
