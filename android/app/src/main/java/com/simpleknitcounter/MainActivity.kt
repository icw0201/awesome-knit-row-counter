package com.simpleknitcounter

import android.os.Bundle
import android.view.KeyEvent
import com.github.kevinejohn.keyevent.KeyEventModule
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * react-native-screens 권장: Fragment 복원을 막아 "context detached from activity" /
   * "Screen fragments should never be restored" 크래시 방지 (배경 복귀, 16KB 페이지 크기 기기 등).
   * https://github.com/software-mansion/react-native-screens/issues/17
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }

  override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
    KeyEventModule.getInstance()?.onKeyDownEvent(keyCode, event)
    return super.onKeyDown(keyCode, event)
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    KeyEventModule.getInstance()?.onKeyUpEvent(keyCode, event)
    return super.onKeyUp(keyCode, event)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "SimpleKnitCounter"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
