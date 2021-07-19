import React, { useEffect, useState } from 'react';
import './App.css';
import { Enttec, OpenDmxDevice } from './Services/Enttec';
import { ColorResult, RGBColor, SketchPicker } from 'react-color'
import { Button, Typography, Slider } from '@material-ui/core';

const App = () => {

  if (navigator.serial) {
    return <SerialAvailable />
  }
  else {
    return <SerialUnavailable />
  }

}


const SerialAvailable = () => {

  const [openDmx, setOpenDmx] = useState<OpenDmxDevice|null>(null);
  const [portOpened, setPortOpened] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [lightColor, setLightColor] = useState<RGBColor>({ r: 0xff, g: 0xff, b: 0xff });
  const [dimmer, setDimmer] = useState<number>(0);

  useEffect(() => {
    navigator.serial?.getPorts().then(result => {
      const enttecPort = result.find(Enttec.isEnttecOpenDmx);
      if (enttecPort) {
        setOpenDmx(new OpenDmxDevice(enttecPort));
      }
    })
  }, []);


  const onRequestClicked = () => {
    navigator.serial?.requestPort().then(result => {

      if (Enttec.isEnttecOpenDmx(result)) {
        setOpenDmx(new OpenDmxDevice(result));
      }

    });
  }


  const onOpenPortClicked = () => {
    if (openDmx === null) return;

    openDmx.open().then(() => {
      console.log("Serial port Opened");
      setPortOpened(true);
    });
  }


  const onStartSendingFrameClicked = () => {
    if (openDmx === null) return;

    openDmx.startSending();

    setIsSending(true);
  }


  const onStopSendingFrameClicked = () => {
    if (openDmx === null) return;

    openDmx.stopSending();
    setIsSending(false);
  }


  const onClosePortClicked = () => {
    if (openDmx === null) return;

    openDmx.close().then(() => {
      console.log("Serial port closed");
      setPortOpened(false);
    });
  }

  const onColorChange = (color: ColorResult, event: React.ChangeEvent<HTMLInputElement>) => {
    
    const rgb = color.rgb;
    if (openDmx?.isSending) {
        
      openDmx.setChannel(25, rgb.r);
      openDmx.setChannel(26, rgb.g);
      openDmx.setChannel(27, rgb.b);
    }


    setLightColor(rgb);
  }

  const onDimmerChange = (event: React.ChangeEvent<{}>, value: number | number[]) => {

    const dmxVal: number = value as number;

    if (openDmx?.isSending) {
      openDmx.setChannel(29, dmxVal);  
    }

    setDimmer(dmxVal);
  }

  const btnClass = "m-2";
  const btnVariant = "contained";
  const btnColor = "primary"

  const hasDmxDevice = openDmx !== null

  const canRequestPort = !hasDmxDevice;
  const canOpenPort = hasDmxDevice && !portOpened;
  const canStartSending = portOpened && !isSending;
  const canStopSending = portOpened && isSending;
  const canClosePort = hasDmxDevice && portOpened;

  return <div>
    <div className="d-flex justify-content-center my-1">
      <Button variant={btnVariant} className={btnClass} color={btnColor} onClick={onRequestClicked} disabled={!canRequestPort}>Request port</Button>
      <Button variant={btnVariant} className={btnClass} color={btnColor} onClick={onOpenPortClicked} disabled={!canOpenPort}>Open port</Button>
      <Button variant={btnVariant} className={btnClass} color={btnColor} onClick={onStartSendingFrameClicked} disabled={!canStartSending}>Start sending</Button>
      <Button variant={btnVariant} className={btnClass} color={btnColor} onClick={onStopSendingFrameClicked} disabled={!canStopSending}>Stop sending</Button>
      <Button variant={btnVariant} className={btnClass} color={btnColor} onClick={onClosePortClicked} disabled={!canClosePort}>Close port</Button>
    </div>
    <div className="d-flex justify-content-center mt-2">
      <Typography>Color</Typography>
      <SketchPicker color={lightColor} onChange={onColorChange} />
    </div>
    <div className="d-flex justify-content-center mt-2">
      <div className="w-50">
        <Typography>Dimmer</Typography>
        <Slider defaultValue={0} min={0} max={0xff} step={1} valueLabelDisplay="auto" value={dimmer} onChange={onDimmerChange}/>
      </div>
    </div>
  </div>;
}

const SerialUnavailable = () => <div>Serial unavailable</div>;

export default App;