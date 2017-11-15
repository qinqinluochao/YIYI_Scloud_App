package com.yiyi_scloud_app;

import android.content.Intent;
import android.os.Bundle;
import cn.jpush.android.api.JPushInterface;
import cn.jpush.reactnativejpush.JPushPackage;
import com.facebook.react.ReactActivity;

public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "YIYI_Scloud_App";
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        JPushInterface.init(this);

    }

    @Override
    protected void onPause() {
        super.onPause();
        JPushInterface.onPause(this);
    }

    @Override
    protected void onResume() {
        super.onResume();
        JPushInterface.onResume(this);

    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }

    public void updateDialog (){
//        UpdateChecker.checkForDialog(MainActivity.getMainActivity());

    }
}
