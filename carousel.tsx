'use client'

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Icon from './ui/Icon'
import { cn } from '@/lib/utils'

interface CarouselProps {
  infinitive?: boolean
  dot?: boolean
  nav?: boolean
  autoplay?: boolean
  speed?: number
  autoplayDuration?: number
  slidesPerView?: number
  spaceBetween?: number
  className?: string
  children: React.ReactNode
}

export default function Carousel({
  dot = false,
  nav = false,
  autoplay = false,
  infinitive = false,
  speed = 400,
  autoplayDuration = 1000,
  slidesPerView = 1,
  spaceBetween = 0,
  className,
  children,
}: CarouselProps) {
  let interval = null

  const childenToArr = React.Children.toArray(children)

  const containerRef = useRef<any>()
  const sliderContainerRef = useRef<any>()
  const slideRef = useRef<any>()

  const [current, setCurrent] = useState(1)
  const [translateX, setTranslateX] = useState(0)

  const slides = useMemo(() => {
    let items = childenToArr.map((child: any, index: any) => (
      <div
        ref={slideRef}
        key={index}
        className={cn('slider-slide', spaceBetween && `mr-${spaceBetween}`)}
        style={{
          width: `calc(100% / ${slidesPerView ?? 0} - ${
            spaceBetween! - Math.round(spaceBetween! / slidesPerView!)
          }px)`,
          marginRight: `${spaceBetween}px`,
        }}
      >
        {child}
      </div>
    ))

    return [
      // get copies of ${slidesPerView} items and place to the beginning of carousel

      infinitive &&
        childenToArr.slice(-slidesPerView).map((child: any, index: number) => (
          <div
            ref={slideRef}
            key={index}
            className={cn('slider-slide', spaceBetween && `mr-${spaceBetween}`)}
            style={{
              width: `calc(100% / ${slidesPerView ?? 0} - ${
                spaceBetween! - Math.round(spaceBetween! / slidesPerView!)
              }px)`,
              marginRight: `${spaceBetween}px`,
            }}
          >
            {child}
          </div>
        )),
      ...items,
      // get copies of ${slidesPerView} items and place to the end of carousel

      infinitive &&
        childenToArr
          .slice(0, slidesPerView)
          .map((child: any, index: number) => (
            <div
              ref={slideRef}
              key={index}
              className={cn(
                'slider-slide',
                spaceBetween && `mr-${spaceBetween}`,
              )}
              style={{
                width: `calc(100% / ${slidesPerView ?? 0} - ${
                  spaceBetween! - Math.round(spaceBetween! / slidesPerView!)
                }px)`,
                marginRight: `${spaceBetween}px`,
              }}
            >
              {child}
            </div>
          )),
    ]
  }, [children])

  useLayoutEffect(() => {
    if (slideRef !== undefined) {
      setTranslateX(slideRef?.current?.clientWidth * current + spaceBetween)
    }
  }, [])

  useEffect(() => {
    containerRef.current.style.transitionDuration = '400ms'
  }, [])

  const actionHandler = useCallback(
    (mode: 'prev' | 'next') => {
      if (!infinitive && childenToArr.length === 1) return
      containerRef.current.style.transitionDuration = `${speed}ms`
      if (mode === 'prev') {
        if (current <= 1) {
          setTranslateX(0)
          setCurrent(childenToArr.length)
        } else {
          setTranslateX(
            slideRef?.current?.clientWidth * (current - 1) +
              spaceBetween * (current - 1),
          )
          setCurrent((prev) => --prev)
        }
      } else if (mode === 'next') {
        if (current >= childenToArr.length) {
          setTranslateX(
            slideRef?.current?.clientWidth * (childenToArr.length + 1) +
              spaceBetween * (childenToArr.length + 1),
          )
          setCurrent(1)
        } else {
          setTranslateX(
            slideRef?.current?.clientWidth * (current + 1) +
              spaceBetween * (current + 1),
          )
          setCurrent((prev) => ++prev)
        }
      }
    },
    [current, childenToArr],
  )

  const actionDots = (index: number) => {
    if (!infinitive && childenToArr.length === 1) return

    containerRef.current.style.transitionDuration = `${speed}ms`

    if (index === 0) {
      setTranslateX(
        slideRef.current.clientWidth * (childenToArr.length + 1) +
          spaceBetween * (childenToArr.length + 1),
      )
    } else if (current === 1 && index === childenToArr.length - 1) {
      setTranslateX(0)
    } else {
      setTranslateX(
        slideRef?.current?.clientWidth * (index + 1) +
          spaceBetween * (index + 1),
      )
    }

    setCurrent(index + 1)
  }

  // infinitive scroll smooth effect
  useEffect(() => {
    const transitionEnd = () => {
      if (current <= 1) {
        containerRef.current.style.transitionDuration = '0ms'
        setTranslateX(slideRef.current.clientWidth * current + spaceBetween)
      }

      if (current >= childenToArr.length) {
        containerRef.current.style.transitionDuration = '0ms'
        setTranslateX(
          slideRef.current.clientWidth * childenToArr.length +
            spaceBetween * childenToArr.length,
        )
      }
    }

    if (infinitive) {
      document.addEventListener('transitionend', transitionEnd)
    }

    return () => {
      if (infinitive) {
        document.removeEventListener('transitionend', transitionEnd)
      }
    }
  }, [current, childenToArr])

  // auto play
  useEffect(() => {
    if (autoplay) {
      const id = setInterval(() => {
        actionHandler('next')
      }, autoplayDuration)

      interval = id

      return () => {
        clearInterval(id)
      }
    }
  }, [actionHandler])

  // dragable
  const [pressed, setPressed] = useState(false)
  const [startX, setStartX] = useState(0)
  const [x, setX] = useState(0)

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setPressed(true)
    setStartX(e.nativeEvent.offsetX - containerRef.current.offsetLeft)
    sliderContainerRef.current.style.cursor = 'grabbing'
  }

  const handleMosuseEnter = () => {
    sliderContainerRef.current.style.cursor = 'grab'
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!pressed) return

    containerRef.current.style.transitionDuration = '0ms'
    const offset = e.nativeEvent.offsetX
    const translateXDrag = offset - startX

    setX(offset)
    setTranslateX((prev) => prev - translateXDrag)
  }

  const handleMouseUp = () => {
    setPressed(false)
    setX(0)

    containerRef.current.style.transitionDuration = `${speed}ms`
    sliderContainerRef.current.style.cursor = 'grab'

    if (!infinitive && childenToArr.length === 1) {
      setTranslateX(slideRef?.current?.clientWidth * current + spaceBetween)
      return
    }

    if (x < startX) {
      actionHandler('next')
    } else if (x > startX) {
      actionHandler('prev')
    }
  }

  return (
    <>
      <div className={cn('relative h-full w-full mx-auto', className)}>
        {/* nav */}
        {nav && (
          <div className="flex items-center justify-between w-full cursor-pointer space-x-3">
            <div
              className="absolute top-2/4 -translate-y-2/4 -left-5 border border-gray/30 bg-white w-10 h-10 rounded-full flex items-center justify-center z-10"
              onClick={() => actionHandler('prev')}
            >
              <Icon
                icon="icon-tgic-chevron-left"
                className="text-2xl text-gray/80"
              />
            </div>
            <div
              className="absolute top-2/4 -translate-y-2/4 -right-5 border border-gray/10 bg-white w-10 h-10 rounded-full flex items-center justify-center z-10"
              onClick={() => actionHandler('next')}
            >
              <Icon
                icon="icon-tgic-chevron-right"
                className="text-2xl text-gray/80"
              />
            </div>
          </div>
        )}

        {/* dots */}
        {dot && (
          <div className="absolute bottom-4 left-2/4 -translate-x-2/4 z-10">
            <div className="flex items-center space-x-2">
              {childenToArr.map((item, index) => (
                <div
                  onClick={() => actionDots(index)}
                  key={index}
                  className={cn(
                    'w-5 h-5 rounded-full bg-white cursor-pointer',
                    {
                      'bg-green': Boolean(index + 1 === current),
                    },
                  )}
                ></div>
              ))}
            </div>
          </div>
        )}

        <div
          className="slider"
          ref={sliderContainerRef}
          onMouseDown={(e) => handleMouseDown(e)}
          onMouseEnter={handleMosuseEnter}
          onMouseUp={handleMouseUp}
          onMouseMove={(e) => handleMouseMove(e)}
        >
          <div
            ref={containerRef}
            className="slider-wrapper"
            style={{
              transform: `translate3d(-${translateX}px, 0, 0)`,
              transitionDuration: `${speed}`,
            }}
          >
            {slides}
          </div>
        </div>
      </div>
    </>
  )
}
