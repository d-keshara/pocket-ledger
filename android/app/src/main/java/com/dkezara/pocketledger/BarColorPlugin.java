package com.dkezara.pocketledger;

import android.graphics.Color;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * On some phones the app is pushed below the status bar and above the gesture bar,
 * and those strips show the window's default grey. This paints them in the app's colour.
 */
@CapacitorPlugin(name = "BarColor")
public class BarColorPlugin extends Plugin {
    @PluginMethod
    public void setColor(PluginCall call) {
        String color = call.getString("color", "");
        int parsed;
        try {
            parsed = Color.parseColor(color);
        } catch (IllegalArgumentException e) {
            call.reject("Bad colour: " + color);
            return;
        }
        getBridge().executeOnMainThread(() -> {
            getActivity().getWindow().getDecorView().setBackgroundColor(parsed);
            call.resolve();
        });
    }
}
