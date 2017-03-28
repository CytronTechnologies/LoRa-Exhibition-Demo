#include <lmic.h>
#include <hal/hal.h>
#include <SPI.h>
#include <math.h>

//#define USE_GPS

#define LED 13

#ifdef USE_GPS
#define payload_size 15
#include <TinyGPS.h>
#include <SoftwareSerial.h>
TinyGPS gps;
//CT_UNO
SoftwareSerial ss(8, 9);
float flat;
float flon;
#else
#define payload_size 4
#endif
unsigned long previousMillis = 0;

static const PROGMEM u1_t NWKSKEY[16] ={ 0xC0, 0xC9, 0xAA, 0xC2, 0xC4, 0x0B, 0xF2, 0x44, 0x1E, 0x95, 0xF6, 0xF3, 0xDF, 0xF2, 0x65, 0x6F };
static const u1_t PROGMEM APPSKEY[16] ={ 0x87, 0xD4, 0xE5, 0xD5, 0x8E, 0xE5, 0xD1, 0x91, 0x31, 0xA8, 0x21, 0x10, 0x59, 0x18, 0xEE, 0x9D };
static const u4_t DEVADDR =0x26031B25;

void os_getArtEui (u1_t* buf) { }
void os_getDevEui (u1_t* buf) { }
void os_getDevKey (u1_t* buf) { }

// We will be using Cayenne Payload Format
// For one sensor, 
// the general format is channel | type | payload
// payload size depends on type
// here we are using temperature and GPS,
// temperature - 2, GPS - 9
// total mydata size will be 2(channel and type for temp) + 2(temp payload size) + 2(channel and type for GPS) + 9(GPS payload size) = 15

uint8_t mydata[payload_size] = {0};

int sensor_value = 0;
static osjob_t sendjob;

// Schedule TX every this many seconds (might become longer due to duty
// cycle limitations).
const unsigned TX_INTERVAL = 20;

// Pin mapping
const lmic_pinmap lmic_pins = {
    .nss = 10,
    .rxtx = LMIC_UNUSED_PIN,
    .rst = 7,
    .dio = {2, 5, 6},
};

void onEvent (ev_t ev) {
    //Serial.print(os_getTime());
    //Serial.print(": ");
    switch(ev) {
        case EV_TXCOMPLETE:
            Serial.println(F("EV_TXCOMPLETE (includes waiting for RX windows)"));
            /*if (LMIC.txrxFlags & TXRX_ACK)
              Serial.println(F("Received ack"));
            if (LMIC.dataLen) {
              Serial.println(F("Received "));
              Serial.println(LMIC.dataLen);
              Serial.println(F(" bytes of payload"));
            }*/
            // Schedule next transmission
            //os_setTimedCallback(&sendjob, os_getTime()+sec2osticks(TX_INTERVAL), do_send);
            break;
        default:
            Serial.println(F("Unknown event"));
            break;
    }
}

void do_send(osjob_t* j){
    // Check if there is not a current TX/RX job running
    if (LMIC.opmode & OP_TXRXPEND) {
        Serial.println(F("OP_TXRXPEND, not sending"));
    } else {
        // Prepare upstream data transmission at the next possible time.
        LMIC_setTxData2(1, mydata, sizeof(mydata), 0);
    }
    // Next TX is scheduled after TX_COMPLETE event.
}

void setup() {
    Serial.begin(115200);
    Serial.println(F("Starting..."));

    //Initialise payload format
    mydata[0] = 0x01; //channel 1
    mydata[1] = 0x67; // type temperature
#ifdef USE_GPS
    mydata[4] = 0x02; //channel 2
    mydata[5] = 0x88; //type GPS
#endif

    //initialise LED as output and at low state
    pinMode(LED, OUTPUT);
    digitalWrite(LED, LOW);
    
#ifdef USE_GPS    
    //start retrieving GPS
    ss.begin(9600);
#endif

    os_init();
    LMIC_reset();
    
    uint8_t appskey[sizeof(APPSKEY)];
    uint8_t nwkskey[sizeof(NWKSKEY)];
    memcpy_P(appskey, APPSKEY, sizeof(APPSKEY));
    memcpy_P(nwkskey, NWKSKEY, sizeof(NWKSKEY));
    
    LMIC_setSession (0x1, DEVADDR, nwkskey, appskey);
    LMIC_selectSubBand(3);
    LMIC_setLinkCheckMode(0);
    LMIC_setAdrMode(false);
    LMIC_setDrTxpow(DR_SF9, 14);

    previousMillis = millis();
    
}

void loop() {
    
    if(millis()> previousMillis + TX_INTERVAL*1000){ //Start Job at every TX_INTERVAL*1000

      //inidicating start transmitting
      digitalWrite(LED, HIGH);
      
      readSensor();
#ifdef USE_GPS
      readGPS();
#endif
      do_send(&sendjob);
      previousMillis = millis();

      // indicating stop transmitting      
      digitalWrite(LED, LOW);
      
    }

    os_runloop_once();
}

void readSensor(){ 
    int a = analogRead(A0);
    float R = 1023.0/((float)a)-1.0;
    R = 100000.0*R;

    int temperature=round((1.0/(log(R/100000.0)/4275+1/298.15)-273.15)*10);//convert to temperature via datasheet ;
    sensor_value = temperature;
    mydata[2] = highByte(sensor_value);
    mydata[3] = lowByte(sensor_value);
    
}

#ifdef USE_GPS
void readGPS(){

  bool newData = false;
  unsigned long chars;
  unsigned short sentences, failed;

  // For one second we parse GPS data and report some key values
  for (unsigned long start = millis(); millis() - start < 1000;)
  {
    while (ss.available())
    {
      char c = ss.read();
      // debugSerial.write(c); // uncomment this line if you want to see the GPS data flowing
      if (gps.encode(c)) // Did a new valid sentence come in?
        newData = true;
    }
  }

  if (newData)
  {
    float flat, flon, falt;
    unsigned long age;
    gps.f_get_position(&flat, &flon, &age);
    falt = gps.f_altitude();
    /*Serial.print(F("LAT="));
    Serial.print(flat == TinyGPS::GPS_INVALID_F_ANGLE ? 0.0 : flat, 6);
    Serial.print(F(" LON="));
    Serial.print(flon == TinyGPS::GPS_INVALID_F_ANGLE ? 0.0 : flon, 6);
    Serial.print(F(" ALT="));
    Serial.print(falt == TinyGPS::GPS_INVALID_F_ALTITUDE ? 0.0 : falt, 2);
    Serial.println();*/
    if(millis()> previousMillis + TX_INTERVAL*1000){
      long lat = round(flat * 10000);
      long lon = round(flon * 10000);
      long alt = round(falt * 100);
      mydata[6] = lat >> 16;
      mydata[7] = lat >> 8;
      mydata[8] = lat;
      mydata[9] = lon>> 16;
      mydata[10] = lon>> 8;
      mydata[11] = lon;
      mydata[12] = alt >> 16;
      mydata[13] = alt >> 8;
      mydata[14] = alt;

    }
  }
  
  gps.stats(&chars, &sentences, &failed);
  if (chars == 0)
    Serial.println(F("** No characters received from GPS: check wiring **"));
}
#endif


