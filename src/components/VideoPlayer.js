import React from "react";

export default function VideoPlayer({
  localVideoRef,
  remoteVideoRef,
  screenVideoRef,
  isScreenFull,
  toggleFullScreen,
  isScreenSharing,
  isRemoteConnected,
  videoOff,
}) {
  const handleFullScreen = () => {
    const video = screenVideoRef.current;
    if (video && video.requestFullscreen) {
      video.requestFullscreen().catch((err) => {
        console.error("[Fullscreen] Failed:", err);
      });
    }
    toggleFullScreen();
  };

  const onlyLocal = !isRemoteConnected && !isScreenSharing;
  const bothConnected = isRemoteConnected && !isScreenSharing;
  const screenShareActive = isScreenSharing;

  return (
    <div className="relative flex-1 bg-black w-full h-full overflow-hidden">
      {/* Screen Share */}
      <video
        ref={screenVideoRef}
        autoPlay
        playsInline
        muted
        onClick={handleFullScreen}
        onError={(e) => console.error("Screen video error", e)}
        aria-label="Screen sharing video"
        title="Screen Sharing"
        className={`absolute z-20 object-cover transition-all duration-300 rounded-lg ${
          screenShareActive
            ? "inset-0 w-full h-full opacity-100"
            : "w-0 h-0 opacity-0 pointer-events-none"
        }`}
      />

      {/* Remote Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        onError={(e) => console.error("Remote video error", e)}
        aria-label="Remote user video"
        title="Remote Video"
        className={`object-cover transition-all duration-300 rounded-lg ${
          bothConnected
            ? "absolute inset-0 w-full h-full z-10"
            : screenShareActive
            ? "absolute bottom-4 right-4 w-40 h-28 sm:w-28 sm:h-20 z-20"
            : "w-0 h-0 opacity-0 pointer-events-none"
        }`}
      />

      {/* Local Video */}
      {!videoOff && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          onError={(e) => console.error("Local video error", e)}
          aria-label="Your video"
          title="Local Video"
          className={`object-cover rounded-lg border-2 border-white shadow-md transition-all duration-300 ${
            screenShareActive
              ? "w-0 h-0 opacity-0 pointer-events-none"
              : onlyLocal
              ? "absolute inset-0 w-full h-full z-10"
              : bothConnected
              ? "absolute bottom-4 right-4 w-40 h-28 sm:w-28 sm:h-20 z-20"
              : "w-0 h-0 opacity-0 pointer-events-none"
          }`}
        />
      )}

      {/* Placeholder for Local Video Off */}
      {videoOff && (
        <div
          className={`bg-gray-800 text-white flex items-center justify-center rounded-lg border-2 border-white shadow-md transition-all duration-300 ${
            screenShareActive
              ? "hidden"
              : onlyLocal
              ? "absolute inset-0 w-full h-full z-10"
              : bothConnected
              ? "absolute bottom-4 right-4 w-40 h-28 sm:w-28 sm:h-20 z-20"
              : "hidden"
          }`}
        >
          <span className="text-xl font-semibold">You</span>
        </div>
      )}
    </div>
  );
}
