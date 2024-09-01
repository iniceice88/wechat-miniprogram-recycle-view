# recycle-view

> [!IMPORTANT]
> skyline 渲染模式下，官方 [scroll-view](https://developers.weixin.qq.com/miniprogram/dev/component/scroll-view.html)
> 本身就可以实现可回收列表，无需 `recycle-view`

对原版 [recycle-view](https://github.com/wechat-miniprogram/recycle-view) 进行重构以及TS化

## 用法介绍

```vue

<recycle-view
        items="{{ items }}"
        itemHeight="{{ 100 }}"
        itemWidth="100%"
>
    <view slot="before">before</view>
    <recycle-item wx:for="{{ recycleList }}" wx:key="id" item="{{ item }}">
        <view>{{ item.name }}</view>
    </recycle-item>

    <view slot="after">
        <view style="padding-bottom: env(safe-area-inset-bottom);">after</view>
    </view>
</recycle-view>
```

```js
Component({
  data: {
    items: [],
  },
  lifetimes: {
    ready() {
      this.setData({
        items: new Array(1000).fill(0).map((_, i) => ({ id: i, name: `name-${i}` })),
      })
    },
  },
})
```

## 和原版比较

- 无需`createRecycleContext`只需要`recycle-view`和`recycle-item`
- 无需设置 `recycle-view` 的 `id` 和 `batch` 属性的值
- 增加`itemHeight`，对于统一高度的情况很方便
- 增加`itemWidth`，宽度可以是百分比形式,比如`50%`
- 保留`itemSize`，但是通过 `Event` 的形式进行传递: `bind:onItemSize="handleCalcItemSize"`
- 原版在设置了`itemSize`之后`recycle-item`中的自定义View高宽必须和设置的值严格一致，否则会出现跳动或者页面有一大截空白的问题，
  我们这里直接把`recycle-item`的高宽设置成`itemSize`提供的值，这样自定义的View中就不需要再设置高宽了
- 多个长列表无需设置`batch-key`
- 移除 `useInPage`，在`Page`中可以直接使用`recycle-view`，无需特殊设置

## 注意事项

- 需要把实际的列表数据绑定到`recycle-view`的`items`属性上
- `recycle-item`中的`wx:for`设置的是`dataKey`对应的值,默认是`recycleList`,和原版一致。但是为了设置`recycle-item`
  尺寸，需要把当前`item`传递给`recycle-item`
