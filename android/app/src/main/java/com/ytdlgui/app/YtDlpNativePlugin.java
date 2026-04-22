package com.ytdlgui.app;

import android.os.Environment;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.yausername.youtubedl_android.YoutubeDL;
import com.yausername.youtubedl_android.YoutubeDLException;
import com.yausername.youtubedl_android.YoutubeDLRequest;
import com.yausername.youtubedl_android.mapper.VideoInfo;

import com.yausername.ffmpeg.FFmpeg;

import java.io.File;

@CapacitorPlugin(name = "YtDlpNative")
public class YtDlpNativePlugin extends Plugin {

    private static final String TAG = "YtDlpNative";
    private boolean isInitialized = false;

    @Override
    public void load() {
        super.load();
        initYoutubeDL();
    }

    private void initYoutubeDL() {
        try {
            YoutubeDL.getInstance().init(getContext());
            FFmpeg.getInstance().init(getContext());
            isInitialized = true;
            Log.d(TAG, "YoutubeDL and FFmpeg initialized successfully");
            
            // Optional: Update yt-dlp binary asynchronously
            new Thread(() -> {
                try {
                    YoutubeDL.getInstance().updateYoutubeDL(getContext());
                    Log.d(TAG, "yt-dlp updated to latest stable version");
                } catch (Exception e) {
                    Log.e(TAG, "Failed to update yt-dlp", e);
                }
            }).start();
            
        } catch (YoutubeDLException e) {
            Log.e(TAG, "Failed to initialize YoutubeDL", e);
        }
    }

    @PluginMethod
    public void execute(PluginCall call) {
        if (!isInitialized) {
            call.reject("YoutubeDL not initialized");
            return;
        }

        String url = call.getString("url");
        String id = call.getString("id", "default_id");
        if (url == null || url.isEmpty()) {
            call.reject("Must provide a video URL");
            return;
        }

        String format = call.getString("format", "best");

        // Use public Downloads directory by default
        File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        File ytdlDir = new File(downloadsDir, "ytdl-gui");
        if (!ytdlDir.exists()) {
            ytdlDir.mkdirs();
        }

        YoutubeDLRequest request = new YoutubeDLRequest(url);
        request.addOption("-f", format);
        request.addOption("-o", ytdlDir.getAbsolutePath() + "/%(title)s.%(ext)s");

        // Extract extra options if any
        JSObject extraOptions = call.getObject("extraOptions", new JSObject());
        if (extraOptions.getBoolean("subtitles", false)) {
            request.addOption("--write-subs");
            request.addOption("--sub-langs", "all");
        }
        if (extraOptions.getBoolean("thumbnail", false)) {
            request.addOption("--write-thumbnail");
        }
        if (extraOptions.getBoolean("chapters", false)) {
            request.addOption("--embed-chapters");
        }
        if (extraOptions.getBoolean("metadata", false)) {
            request.addOption("--embed-metadata");
        }

        call.setKeepAlive(true);

        // Run in a background thread to not block the Capacitor bridge
        new Thread(() -> {
            try {
                YoutubeDL.getInstance().execute(request, (progress, etaInSeconds, line) -> {
                    JSObject ret = new JSObject();
                    ret.put("id", id);
                    ret.put("type", "progress");
                    ret.put("progress", progress);
                    ret.put("eta", etaInSeconds);
                    ret.put("line", line);
                    notifyListeners("downloadProgress", ret);
                });

                JSObject result = new JSObject();
                result.put("success", true);
                result.put("message", "Download completed successfully");
                
                // Ensure we finish the call correctly
                call.resolve(result);
                call.setKeepAlive(false);

            } catch (Exception e) {
                Log.e(TAG, "Failed to download", e);
                call.reject(e.getMessage() != null ? e.getMessage() : "Unknown error");
                call.setKeepAlive(false);
            }
        }).start();
    }
}
