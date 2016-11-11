#include <SoftwareSerial.h>
#include <TheThingsNetwork.h>
#include <TinyGPS.h>

// Set your AppEUI and AppKey
const char *appEui = "98F5F4875F63C1F1";
const char *appKey = "F2DD568915BA735EFB60A5B0F0B81AC5";

SoftwareSerial loraSerial(2, 3);
TinyGPS gps;
#define ss Serial5 // CT-ARM with RX pin 8 and TX pin 9
#define debugSerial Serial
#define sendingFreq 7000 //7 seconds

unsigned long previousMillis = 0;

TheThingsNetwork ttn(loraSerial, debugSerial, TTN_FP_MY915);

void setup() {
  loraSerial.begin(57600);
  debugSerial.begin(9600);
  ss.begin(9600);

  // Wait a maximum of 10s for Serial Monitor
  while (!debugSerial && millis() < 10000);

  debugSerial.println("-- STATUS");
  ttn.showStatus();

  debugSerial.println("-- JOIN");
  ttn.join(appEui, appKey);

  previousMillis = millis();
}

void loop() {
  debugSerial.println("-- LOOP");

  readGPS();
}

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
    float flat, flon;
    unsigned long age;
    gps.f_get_position(&flat, &flon, &age);
    debugSerial.print(F("LAT="));
    debugSerial.print(flat == TinyGPS::GPS_INVALID_F_ANGLE ? 0.0 : flat, 6);
    debugSerial.print(F(" LON="));
    debugSerial.print(flon == TinyGPS::GPS_INVALID_F_ANGLE ? 0.0 : flon, 6);
    debugSerial.println();
    if(millis()> previousMillis + sendingFreq){
      unsigned long lat_converted = flat * 10E5;
      unsigned long long_converted = flon * 10E5;
      uint8_t mydata[8] = {0};
      mydata[0] = (lat_converted & 0xFF000000) >> 24;
      mydata[1] = (lat_converted & 0xFF0000) >> 16;
      mydata[2] = (lat_converted & 0xFF00) >> 8;
      mydata[3] = lat_converted & 0xFF;
      mydata[4] = (long_converted & 0xFF000000) >> 24;
      mydata[5] = (long_converted & 0xFF0000) >> 16;
      mydata[6] = (long_converted & 0xFF00) >> 8;
      mydata[7] = long_converted & 0xFF;
      
      ttn.sendBytes(mydata, sizeof(mydata));
      previousMillis = millis();
    }  
  }
  
  gps.stats(&chars, &sentences, &failed);
  if (chars == 0)
    debugSerial.println(F("** No characters received from GPS: check wiring **"));
}

