import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, ClipboardCheck, Download, LogOut, MessageSquare, Search, Settings2, Users, HelpCircle, X, CheckCircle2, Eye, EyeOff, Trash2, RefreshCw } from "lucide-react";
import mohLogo from "../assets/de5a2654c982994c-MOH_Logo.png";
// MOH logo embedded as base64: the .doc export used to pass the Vite URL (/assets/...) which Word cannot open, so it showed a broken-image box.
// This is the same logo bytes as the last accepted 2028 .doc, which displayed correctly.
const MOH_LOGO_DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIbGNtcwIQAABtbnRyUkdCIFhZWiAH4gADABQACQAOAB1hY3NwTVNGVAAAAABzYXdzY3RybAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWhhbmSdkQA9QICwPUB0LIGepSKOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAABxjcHJ0AAABDAAAAAx3dHB0AAABGAAAABRyWFlaAAABLAAAABRnWFlaAAABQAAAABRiWFlaAAABVAAAABRyVFJDAAABaAAAAGBnVFJDAAABaAAAAGBiVFJDAAABaAAAAGBkZXNjAAAAAAAAAAV1UkdCAAAAAAAAAAAAAAAAdGV4dAAAAABDQzAAWFlaIAAAAAAAAPNUAAEAAAABFslYWVogAAAAAAAAb6AAADjyAAADj1hZWiAAAAAAAABilgAAt4kAABjaWFlaIAAAAAAAACSgAAAPhQAAtsRjdXJ2AAAAAAAAACoAAAB8APgBnAJ1A4MEyQZOCBIKGAxiDvQRzxT2GGocLiBDJKwpai5+M+s5sz/WRldNNlR2XBdkHWyGdVZ+jYgskjacq6eMstu+mcrH12Xkd/H5////2wBDAAYEBQUFBAYFBQUHBgYHCQ8KCQgICRMNDgsPFhMXFxYTFRUYGyMeGBohGhUVHikfISQlJygnGB0rLismLiMmJyb/2wBDAQYHBwkICRIKChImGRUZJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJib/wAARCAB3ATEDASIAAhEBAxEB/8QAHAABAAMBAAMBAAAAAAAAAAAAAAUGBwQBAwgC/8QAQRAAAQMDAwMCAwUFBQYHAAAAAQIDBAAFEQYSIQcxQRMiFFFhCBUycYEWQlJioSMzgpHBFySSsdHhN1RydIOT8P/EABoBAQACAwEAAAAAAAAAAAAAAAAEBQECAwb/xAA0EQACAQIEAwUGBQUAAAAAAAAAAQIDEQQSITFBUWEFE3GB8CIykbHB0RQVI6HxQlJy0uH/2gAMAwEAAhEDEQA/APqmlKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQCsplzr9YNbXSU9IdcisK+LcjeqpQkQ1HBWhBGNzeecEcIAwc5rVqq/UXTDeqNOvxkZRPaQpUV1KtpCiOUZ/hUBg/9q5VYtq8d0WPZ9anTq5Kq9mWj6dfXjuiysutvMoeaWFtuJCkKSchQPIIr91mHSO9PxoLFhuHq+jlSYTrgJKNoSS0o8gHCwQCc9xge0Vp9bQnnjc44vDSw1Z03quD5oUpXJd5EmLbJMiHG+JktoJba59yvGcAnH5An5Vu9CNGLk0lxPFxulttvpCfOYil1W1AdWE7j/wDvNdgIIBByD5r5I1RJ1LIvMr71VIE9t1a3fUQULSnCcEj+DHYfnWt9GLrf3ZUqK/EcdsrzzpjvIQr0WcEn2LPBSTkY8EA+VGolPE555bHpMZ2C8NhlWVRN8eXl61NcpSlSzzIrNuomoboZDsKyPKQxBcbalFpZSuQ+5jZHbI9xOPcraQeRyOatGtdQfcdrWY4Dk91Cyw3tUrASkqUtQSCcAD5d8du4pfSPSshMiVqK8PvyHVSHDGaecKghzlLjuOxUSNoOMjBqPUk5PJEusDRhRpyxdbZe6ub9ceG/A0qztymrTCanLK5aI7aXlFW7KwkbjnzzmuulKkLQp5PM2xSlKGopSlAKUrP+oGp9T6S1BBu5tzUvRCGAm6vIwX4qysgOgZyUDKd3BwMmgNApVT6YHVTuk40zV1zjXCdMSmS2piOGfSbWhKg2oDglJKhkAZGPNWygFK4rxdrVZYSp14uUW3RUd3pTyW0D9VEVnznVlu8LVH6e6Xuur3QcfFoR8JCSfIL7oAz+QOaA06lctqXOctkRdzaaZnqZQZLTKipCHCkbkpJ7gHIB811UApSosahsap0SAi6RlypoBjtoWFF0ELPGPo05/wAJoCUpVB6u6/jaCh2J+QHSm4XRqO4WW/UUlnlSyE+eABgc+7jmrneLjGtFonXaaooiwY7kh5QGcIQkqUf8gaA66VTul+s4ustAQtTF0BSkK+LSEFIacT+NIHkDwfIxWeO/aQ025GiP2vTl6uHrXMwVpQztwn91aTghS1ZGG8g984wMgbpSvW6+0xGXJkOJYZbQVrW6oJCABkkk8DFU3T3UCLqjUot2mLbJudoY3iXfR7IiFAcIaUf71W7AO3gDnJoC7UqjWrqBbpvVi9aD9UiTAhsOtJ9M4Ws7lO+76JWzwf5u/jql9QtPReo8Pp+pUhd4lRy+C23ubb4KglZByCUgntjGOeRQFvpSlAKUpQClKUBlutbIxbtQ/GBbEWLcXELCy2tKvWLrRWn1UfgyEbgVA8leBVy0ZfFXi2gSVNfGs5DhaWFIdSFFIcSQBkHafAwQfpXbqOA7cLU43GVsmMkPRV8e11PKe4I57cg8E1ndudkBP3za0wZc+FBS856J9F4KcWoll5IyFElJBzt2nBA4GYz/AE53XEvYtYzCqMn7UdL/AC8n47mr0rhs9yYusISWQUKStTbzSiCppxJwpCscZB+XB4I4IruqQncpJRcW4y3Rh3XF23x9VxDMVISXISNqWChIzvWCokpOcccfStb0ggN6Vs6QoKJhtKUoJ2hSigEqx4yST+tZX1QvCjqIyI5SmP8AAqQy4GW3i64hagFAK/CNy1AK87Vd+K0zQ8xEnTUBkhLb8Vhtl1tKwrGEDCgR3SpOFA/I/nUWk13sj0WPjL8uo3W3ry9XJ6ua4zGYERcl7cQnAShAypaicJSkeSSQAPrXuedbYZW884ltptJUtazgJA5JJ8Cs8u8t+/yET34bTNqgzEJb+PUA0tK0DDq0DJIO8YCtuB9VHEicsqKbDYfvpa+6t/surIJxEnVF5QHJEJyVPS3vjh5b4YaIfSrKRhKShKsjOcrwf3sVrsKKxChsQ4rYbYYbS22gfupAwBVV6ewD8Oq6OrQ77Pg4q0ISlPooUrlOCfapWSOTkBJ84q4VpSjZXfEk9o188+6j7sfX7fcUpSuxVilKUArwpSUpKlEJSBkkngCvNcd5tsa8WibaZoWYs1hbDwbWUKKFJKTgjkcGgIwaz0oX7SwnUNvWu8hRt+x9KhJ299pHB5OPqeO9TFwYiSYEmNPbbciPNKQ+h3GxTZBCgrPjGc1kFk6PdK9JXTTMaU+ly9sSnH4BmSglyYsHcAUcBQR7SMAcj6nOwyo7EuK9FktIeYfQptxtYylaSMEEeQQaAz65dWtHw3/ujTglaquTSQlMGwRzJ2jHGVj2JSMc+7j5VwPvdWdR7TIkWnp3bXTtAUtM6erPjJw2nI/Mg1pFotNrs0NMK0W6Lb4qPwsxWUtpH6AVmvUrQl7vc+fIj3y1WyyOATXn5jS1uMvJjrYXjCkgILSgrduBSpAIHkASlm6RaSizU3O9pl6ruw5+Nvr5lKB7+1B9iRnthPHzrQW0IbbS22hKEIASlKRgADsAKouneq3Tu6BuHG1vbX5LYDalSF/Dl1QGCQFhIOT8s1eWHmZDKXmHUOtLGUrbUFJI+hFAfulKUArOIvS5tvVDN7kaluDjEOYqTDgNNNNttJLq3fTUraVLAW4vnIO0lPk50eqPrLqtoHR1yTbL/qBuPNOCphppbymwfKwhJ28c4PPyFAVj7TDLbemNOXxxsKTZ9RQ5LhIyPTyUqB+hJTWk6vg/eek71bSN3xkB9jHz3tqT/rWf9aZdo1l0D1FPsk5i4QlxkyGn2VbhlpxKz+RG0gg8jkVoel5/3rpm0XTdu+NhMyM/PegK/wBaAoH2YltOdENOFpCEECQlYT/EJDgyfqeD+tW9646NsqLq2p22QvgHES57TaEpU245ja4pKRkqUcYOMk4qk/ZjQI/TV2AlaVIg3aZHSB+6A5nH9c8/Osv696eu56pXHWGjITk52xxYcy+NLVuaWpKtzaCjgrAQ0hak+AEmhg3K/aBa1TqB2bqq6SbjZmlI+EsSFFuKMAe94Dl1W7JGfaBxg1J6O1Lpy9OXa0afKG/2flmBIjoaDaW1J/hA425CgPqk17tCaib1Zo606jaYVHTcI6XSyo52K7KGfIBB581mXSK2q051v6n2ZLKSxOXHuTbo4wFlatv5AuqH+GhkkIERm3/ahuTqmkb7rpdD6HfO5DyW1JH6JSf0FSmsNX23TvVrSNnXYmHpt+ZdjLue0B1lsEFCAccpK+SM8cHk1+tSx/T65aJlpOC/a7kyrBPIR6Khn9V1CfaSsUe5WLT9zjSBH1Db7xGTaik4ceccdQktp/ov/wCOhg2ClZd9ozXNz0F0+FwsjqGbnMloiMOqQlfpZSpalhKsg8II5BHuFePs79Q53ULRTsq7pb+9bfI+HkLbTtS6NoUlzA4BIJBA8g9gcUMmpUpSgFKUoBWOdTbbIgXpbgTmHNQpyOpCB6iXQFEtJVtPBWor2nAVuWPArY6i9SWhq92h2C5tSs4Wy4R/duDlKv8AQ/QmuVWGeNiw7PxX4aspS2ej+/kZLou+I03e0qkPNR4M5QQ4zuUSU59jvKjjAKQTwFJJ/eSBWmdQn3Y2kJzrDbrqwWk+kysoW4C6kFAIBI3Akdj3r5zu7DsWXcoN0DiLiy56jTyzkA7sLz35wCOM5I47c6bpnVKr504lwHXdlwty2UtuLPDiEvI2qB284OAeD4z3qHSq6ODPT9odn3qU8VHXWN+q0s/pzM+NvvkeMhkWV9o427ZEgHGCAkJG0YwPOcck5Bq6dJWrpH1al1+HMjxZDZbQt6SXEkJSo7MbQDg8jtjBAzyR+GrlqGOlTar+2g849FEkp+iuB/mP61+2dT3CzP8A3xcpibgloLDKEh7cV+mQnIWO2dxJzwB5rSCjGSdyXiKlavRnSUVeSf8Ad9Sx9U72qU5+zMJxKiAlctGSC5nlLQwQee5AOT7QMjdinWFiTcLxGttuUWnnnULUlwFQY27VKebzuHBChuUQVZAOQcVRXZXx3xNylrXNnTHQWxkAJJJKs/n7gMY5Hyzj6D6Y2F622Zu4XEl24ymwCtY9yW+4HbOTweecBIP4RW8G607kfE04dlYRRTu/nLi/Bf8AC3xWGosZqMwgIaZQEISPAAwBXspSrE8M227sUpShgUpSgOe5Pri26VJbR6i2WVuJR/EQCQKhrRqJlXT+Dqy6OttsqtTdwkuNjCAC0HFEZPbvjmp9xCXG1NrSFIWClQPkGvlmJozrFPnt9Jrk461oaI+Au4htKfVhJXuSgODkkjA29we/AoD9OdP9XdR9NTOri58mPqt11MzT8FpYCWI7aiUIGR+JQ5T25wT+I403o71mset4bVturzNp1O1/Zvwnj6YeWO5az38+38Q/LmtUiR2IcVmJFaSzHYQltptAwEJAwAPoAKzDqh0P0fr2Q5clpctF5WPdNiAYdPguIPCvzGD9aGDVKjdSWaJqGxTbJPU8mJOaLL3or2KKD3GfGRwfoTXzv/sV6y2dJjac6qqVETgIQ/MksAD6JAWB47V1x+gmvrySNY9V7jIYJ9zDDrzwUPkCtQCf+E0B56jdO/s72GMsXWcLJJQnHpW+4LdkEgY/ujv5+pTj5+axDTujNVX+8vudJoupBZwrCJst5MXJ85WlQQT9ASfpX1Xo7oP030ypDybMbvKT2fuig/j8kYCP125+tdumdVSI+s77pec5OuLzU9tqFHjWsttRYxaQreXANgQCspypRUSk4HIFBYyTprpnqxH6oRNP6n6iyS3AjNXSVDFzdfW8ypak7PcMH3JAVzwFDHfj6E1jqqx6Osi71qGamHDStLe7BUpSlHACUjknuePAJ8Vm3WnpXqTVOp7Zq7RGoW7HfIkf4VxbjrjIW2FFQIW2Cc+5QIIIIx2xzC6f6C3S8SFTurGrpWpnUsrbjxGpDpbYUoY3pWrByO4ASBkAnPagL31B136VktsHREuJdNQakX8PaS04lxtAxlb6iMjahPu884471Rbh0o6OaU06+vX90bl3R8F2Xc5s5aJDrp5Km20qyeckDCifOagWfsqMtz5LrWtpEdgL/wB22RAXAjaM71bwM5yOB2APnA64H2UdPoXmfqy5SEZ7MMNtHH5ndQFY6bXzTGlukGurZLvK1wb89Lj2OI4nMqUhTRaSv0k5Kdx2jJwMpNfSWhGXLB010/HvJRDcttnjollw7Us+mykL3HPG3ByfpUBoXo1oDRcpudbLQZNwaIKJs5frOIPzSOEpP1SAa4tW2fUvUq4Lsb7b+n9Ex39sxTgKJd22n8CE922cj8R5VwQMUB0/Z9jvJ6ctXJ5Bb++J0q4oQU7SEOuqKMj6pAP5EVQ9edL+qN96g35Nn1Qi1aTvzjT0paH1BZAaS2pBSBuJwnGMhJGMnwNnvlwe09bI0ay6amXZwI9KNDg+m2hASAAFLWpKUJ7Dvn5A4rL9QWTrprhaoz10tWhLO5wtmG+p+UU/VaQM/wCFSB+dASer+pWkul1mg6QsTarzeozKIkK0Qz6iwoAJT6pH4STjj8RJ7eamej+nb7Ah3LU+sCg6o1E6h+Y2gAJjNoTtaYGP4QT+p7nGTD6U6e6N6RwRc4touuoL27lPxbUJUqQtWDkICRtaB55JGexUahtSXLrprR1Vt05pxrRFrcOFXCdKQqSU/QJJKD+SSf5hQHX1b19YNGdQLddbmszZVstbzcK2xlJU88/IWjOf4EhLIyVd/UG0HBFcXRyw3/Xd3idV9dTkyFI9UWO2NY9KGkqUkqIH7wwUjOTwCTkDFi6YdFtO6Mki9XB1eodSLV6i7lNG7Ys9y2kk4P8AMSVfUZxVFvVp609OL/c4vT2EzfNMXCSuVGYdQlfwa3FblIAKkqSAT9U4575oDUetb+hI+hpD3UGM3MtbbiVtRt6kuuvDO1LZSQrceexHGc8ZqH+zvaZMbSEu/wAu1tWlWoJXxceC0nAjxUtpbYR8z7EZye+4HuTVR0h0g1VqvUDGrustz+8HmDujWRCkqab5zhYT7An+VOd3G4nkH6CAAGBwKAUpShkVUdbO6vVNhxtKllOG1OSCtSATyAkDck/X/vVuqp6tv72n7rFeRanp6X2VIJQ4lARhQPdXfv2HNc6lsursTMEpOsssVJ66Pb6FEVq7WsT4tuZPjqVCO19xlpLqUnG4gqSkJyBxj/MjtU5+0t9tarfOvd4hIt0pxG1aiyEuJ3ALIKVZOAc8dvrVUeuC0uumBYblBaKlKYZZubISwVp2K2ZSSjI5ISQB4xXi4xbfqs2Gwvadm2uNFeLbSo9xbcOHFp3qUCglRwCfGOSeKhqcls9fM9XLDUpNZqcVHjbLdK3jz5X48ta/1H1FatTXJmc3FcgJdRvHqPJUiQgFSUuKCclKgEqGDk9u2c1D6WvQhargyWVBiI082p1aiopAGCSrbnIyn5H/ADrRoHSzU0ZTkNm8W5iHHBDDrkJD6ncqKhncMp/Ec+BgYzyao2p9HX6x3ttmVFXOlylLMdcRlCG3Mc+3A5Vz+HaD2xkVHnGonnaLjC4jAzg8NTmmrO2r281y6uxs7nUa2RoqJEtbSGlDIeLEtLah4IJj4PceaoXVrXVsu9phQorsWSUyPWU036uQPTcTk70JA/GDjnt2qHnaL1Y1BlP/ALMywypO9AS+0vkke4NJG4HBVwc4z2GOOXT+jdUm6RnIdvFtXJeLQ+8ojS20+0qynck7xtSo8JHbv2rrOrVkstv2IGFwHZ1CXfxmrxv/AFK23S9jj0EbMNSQ51zK27Yl9tp9xSkhsLWlW1LmT+Hckkq+QOe/GrwdV6tkWMXtRtS4RSCpbL6CEKODsPJO7BHHfPGKiZHTDUVzmIt94ucFVr9RLq5EOG1HX7UqASEoSMn3nk9v6VAWWfboWkGLE5Z5ocS+mY3IeltIU26QAVBOQSkYIweef1pBSp6PQYmWHxzzwtNqytukteeXXnpwWnO9QdUaqnykxIiILshbZcSj1UgqSD3Ge/cfoQe1WvSU69ShPYvrDTMmM+EpDRBBQUBQzgnnk/8ASsytd6tse7MT5rciWI6nHW0KlsjDylblLO3aD88ds5x4A0bRd1RenrtcGmVNNLfQlO5QVnDafIJFSaUrvcocfh+7g7U0lbfrfx5dCzUpSpR50UpSgFKxbXPW+VonqHE0nfNIoaiy3G1N3FFzCv8Ad1uFHqlv0uCNqjtKvHfzV76q61j9P9Fy9Svw/jlMrbbai+r6XqrUoDG7BxgZV2P4aAt1KyvRnULV+uenN01PYdHxYcwJKbSw/cA+mW4lRSsLGG9gBHlXOfGOdD027d39P21+/wAZmJd3IzapjDByhp4pBWlJyeAcjufzPegJGlKq+hJms5bd2GsrVDt62Z7jcAxFAh+MMbXFD1F4J54OPyFAWilKj7HerVfoa5lnnNToyHlsKdZOU70HChnzg+e1ASFKUoBSlKAUrMNZ651O7rpWg+n0O0SL3EgG4TXbwpwMob3JSltIbIJWd6TyQAP6e3qn1Cv3TvSluvsrS8e7IWlDc8tXD0Aw8QOEAoUVJJ3c+MD50BpVKzPVfULVGmunDGspuhGy4n3TYAvCMxWycIXvDZC85TkAcZ81ZunGo5+rdIwtQz7Miz/HJDrEdMsSMtEApWVBKcE5PGOKAs1KUoBSs3vmtdQWzrZpvRXw1uXZb3FedDu1fxKFNtLUed23GUDweCauTd6h3F28W2yTosi62wBDzSiSll1SSUBePHzxz380BLUrOehOuLzr7SU27X2HEiy4tydh4hpWltaUJQdwCiT3WR38Vo1AKUpQClKUBw3y6w7JaZN0nrUiPHTuUUpJJycAAfMkgfrVS0jr93VS5ItliWERzgrekpSDnt2B5PPz7VcbpAjXO3SLfLSVMSEFCwDg4PkfWqPYNFR9KrdSWpFzgmU3KbcbP9s0tG7BWgY3j3HlOScD28VxnnzK2xaYVYR0Jqov1OHK3xWvn4FpFxuypYiJtkUPen6iguaQAnOPDZ5/6VX1Xdd4LiZku1wX4EwFqMG1SnvUQASUgKSruVJICc8Gv1aLZAkyLnb7Td5SUER5C3UvErQpT7zikc8pPjB57Eg+bJYAlTEt8EKU7Mf3EJwfa4pGD88baK8jMu7oXaWqtzT1143WpwW+7Xm4uOxUW1uC60ElUiQpRSpKs7VJbwFHODkK24+Zr1TGIMG/2P4uYXrhIfc2PSCNygGVgoQMYSPck4SBnHOTXc9cYcO8zVyXQ3hhlCU4ypxWXDhCRyo4I4AzVSuTyb87cfjYkwPsuIZVbS0PWjsZ3IkNqByFZ924ZHtCMZGaxJ2XNmaNPNNtLLG3DqrcfHovC6NGpVW0tfX1Posd5dSuf6fqRZiQA3cGR++nHAWBjcnx3HB4tNdYyUldFfWpSpSyy/nqKUpWxxFKUoBSlKA+Weutg/ajq5qS3Mo9aRH0aZLQTypLjTwcAHyJAx/i+tdt3vrnVCL0l063mQZDKrtc09wVRkqb5+inEOp/UVfoWh9dtdZpWvHZenVQZkf7veigPFfwm9JyMjHqewd/b3GPNejQ3Rt3p9LvN60zeGZ93kR1Rrc3c2VJjxW1O7yk7FFSvzGOfzoYM40SlMn7HV9Di1n4Zx9be1wpKFJcSodj8znHnNc+sIjkuxdBHmrhNhzp6o0NUxh9QcQklkBSQcp3DeTnH0ORxV70d0k1dZuk+pen8252Zxq5IWuJIZ9Xcl1W3IcyPw+wcgZHPel36Va3l6W6cRo9wsKbxo2Sl0+op74d1KCgo5CdxP8AZjIwnOTgigIvTtjToD7SMHS1oulyk2u+2Vcma3Okl0uO5dysnjKstA57+5Xg1AaFjaqV066s2nRT8oXCNe1tRG0PKU4GwvasIUo53FtJGc7jgc5xWuak0LqCZ1v091Atkq2pgW+B8FKYklz1Skqd3FASME4d4yRyKqLHSbXcG162g2y+WqMu93dFygSEOPJW2Uvb9rmE8Ap4wN3P0oCk9LLP081Jcno8dd00/do9sfZumnJb76VSXMBSnUO7woYI9yMZIJBGM5/HSbRdhk/Z31Rqp1mSbp933BIcTKcQkemn1EEJCgMhSEn64wcgkVqmnem2qLl1Ea131BmWT7whQVQ4rNiQ4lC9yVpLjinBkq2uKAHbt2xgxuh+mXUDTmidRaDeuunpFhnxJrUR9KHhJDjzZQkr42pSCckAKPJwTxQEF0i6TWbVXTS3aju11vEu6XC2OxG/VmqDUdIWpLYQE4ICSkEDJHJyDnFUtmX+0X2erVpeal1zUsXUYsUEqeWFtLWsKJIB9yQgqRyCBx9K+i+jOmr/AKP0FC03qB+3PvwVrSyu3lZSWidw3FYBKtyl9gBjH1rJdM6NDf2qryyiS29bIIXfTHTkhuQ8kJAUMcKy4pYxkYA88UBoPXO/T9A9HJDtikutTWkMQY8lXvWgEhJUSe6toVz8zmsp6paZY6aaR0p1J0pMmRr+Ho6Li85LW794+o2VqU7uUckqScgcYUfkK3/qZo+JrvRdw01LfVGEoJU1ISncWnEqCkqx5GRgjyCeR3rNGOlmvdR22x6a6hags8nTtikNvsm3NufFS/TSUIQ6pQCUgJJyQCTn580BX7bo3Tt0+1dqeDOhOux2ram5IT8W8kiQVsKKshYOMrV7c7RnGMAYtn2uP/B2R/76P/zNS0fQupYfXqbr+JKtZs9wgJhPsOlwyAkJRkpAG0Hc2nkk8E8Z5r39ddFak1/plrTtllWuJFW6HpDswub8pPtCNoIx3zmgKB1eX1WPRy7C+MaQTZ/hGfVVCekmRt3oxtCkhOc4zk/OozWGqbpZOinSyyWyRMjJvrcdiUuDw+pkJQFNtnuFK3jGMdsZ5rS9caT17qjpajSbkvTzNwkpDU58B8NemlQKC13IV7Rndkd8VCXjpDer70rsOm7hdYMLUOm1pNsuELeWwlISBv3DcCcZJHYpSR5FAU7T8a/6A1DqzUWltM3yx6NTY33xFvBBCZaEFTZCS4pWCodyc4UQfFV7U9giy/s9M9U5cu4P6ymOJW9c1TXQohUgo2BIVtCQngAAYredP2HqLdLbPtHUe62CZbZsJyI61aWHEur3p2lRWrABwTwE9z9KzSV0S6kL6fzNBN60tS7FHd9W3sKjqSp7Lu/Dq9pKADlQCd2SeTigJG+I+O63dJG5K3FiRYZSXFhxSVndFcydwIUDz3BzUP8AZ/0Tp97qVr6YpiQHdPX9bdvxKcwhIceACsq9/CRyrJq9SdAawd1p071OmZZfV05EMS4Nku7XEqSUKLQ28nYpWNxGFY7jimkdBa30j1K1HdrTcrG/pvUVxE2WiWh0ym8qUpSWwnCQf7RQBJPYcd6AxTQ2iY2peiutL/Mu90besM2c/BisyNjDbjbKHS4UgZKjnbkngdsV9IdELtMvnSjTVynvuSJTkTY464cqWUKKNxPknb3qpdPumGpNO9Ndb6PnzrW6q+mWqG6wpwhCnmfT/tCUjAG1B4B/e78Vcuj+mrvo/p9bNN3p6G/KghaQ5CKigpKyocqAOfcfAoC50pShkUpSgFVfU+p2ocxNjtsiObw8grJeVhuK2ASXF/PABISOT9Bk16tTamUiWbJZXAZpIRIlhsuph5GcbQCXHSASGxzxk4AqrhFliJkxvuqTd5cxZbgocdIfmKxtdcX5QCrcFqVj2gDHGK4TqcEW+Ewe06q8F9Xfhxty12383SJbILqm0OSJk5DhbYdirSZNxluD3blqThGwJ5xwlKk8gjFWvS+l3YFqDV0uEyRKdcU84GpzyW2io5KU+7JGSclWSokk179L6dNuWu43JbUi6vJ2lTSdrUZvw0yn91A8+VHk1YqzCnxZrisa2u6pyuuL5+HT1tZHHCtdvhOLejRUJfWMLfV7nF/+pZyo/qaiNZab++4yZEGQYV4jJPw0pCinIPdteO6FeR+v52OldHFNWIEK9SFRVE9UZg0yxeE22HIm3CHJhPGK/GkyE7oLu3KFoWE7lKJAKFkkKGU592DaNMajEmWbHc5Mdd0bbDjTzCh6c1ojIcRjscd0+O4yOa92p9Oi5LFyt6mo93ZbKEOOo3NPo7lp5P7yD/mDyPrS3WbLNSxHVa5lpmRHNtxQ28S7BAQQ2tvnKk79u1SQRgqGPcQeHtQZdJ0sXTs7/wCr3809uuietm9VpVT0zqUuTBY7w6kz05SxK2FtEsDnG08odAwVNnB5yODVsrvGSkropa1GdGWWX8ilKVscRSlKAUpSgFKUoBSlKAUpSgFQLGkNNx9VyNWs2llF9koDbs0FW9SQkJxjOOwA7eKnqUApSlAKUpQClKUApSlAKUpQClKUApSojU2o7Rpq3mddpSWUdkIHK3D8kp8n/l5rDaSuzenTnUkoQV2+BLKUlCSpSglKRkknAArPtQ6ouV5T93aRBDTyy0LlwPVI/EljdgHHlfYYOMnFUm69RIeoFlN2bnMQA9lEVgJcZcTg4DyQUKXyCcBeDjG0+bVYIdzvbi3bS+LfbFrLiJiW1IUyCkJKGWlDaF4BG8le0HAxyBFdXvNInoIdnPBrvMQtevur7vp8z1hpyBqOJD01aUC4Ms7VMOyVK9DcFbnZBbVtyoqBIUVqVtHA4Iu+ndPsWguynnlTrpJ5kznQAtf8qR+6geEjj867LJZ7fZYQiW9j00Ela1qJUt1Z7qWo8qUfma767Qp21ZW4nGOr7MNuL4vx306fG4pSldSuFKUoBUHqXTzN4DUph4wbrGB+GmtpBUj+VQPC0Hyk/wBKnKVhpNWZ0p1JUpZoOzMtcadu2qHoWo7UUTFsBKo8eWpJfKSNj7G9SU4T7jwQtJUQQe5k9O6rnWxYtWrk+iULDSJ6lpVsJ/Ch/bwhRHZfCVfSrdfbLAvcQRpzaiUK3tPNq2OMrHZaFDlJFUK+s3S0OBu/yW5VtU4hbsohSUTUj2ht5CW1Yc/CMpwFpGCPlGcXB39eZeUqtLFx7pry1uv8ft4brVad35FKxGz9Q7ZpzEeDLm3C3eqCIq4+ER29o9ra1r345BAUMEcDHetesd5tt9t6J9rlIksK4JSeUn5KHcH6GusKsZ6LcgYvs+thfaknleztb48n6VyQpSldSuFKUoBSlKAUpSgFKUoBSlKAUpSgFKUoBSlKAUpSgFKUoBSlKA8L3bFbMbscZ7ZrBpmj9YXe/SnbhDE2U7uQt6VJQpLaCpJSEJSRtTjIIBzyf8SlcatNTsmWeAxtTCZ5U0rtcS6aX6X2+CtEq9LROfB3BhAwyhXnAwP6AZyc5rRW0IbQlttCUISAEpSMAAeAKUreEIwVoojYjFVsTLNVlc80pStyKKUpQClKUApSlAK/D7LUhlbD7SHWnAUrQtOUqHyINKUCdtUZlqjpZHfWqVYnfSJX6ioby1ems/Qg5/1/mwAKodriag01qNtNtZNsktFDbzbTocbdyo4StJVg9wAQcjByc+6lKhVaUYtSWh6rs3tGvWjKjVeZW4/DXn5n0B6tw/8AKNf/AG/9qUpUyx5jMuSP/9k=";
import { isSupabaseConfigured, supabaseLoadAll, supabaseUpsert, supabaseDelete, sbSave, sbLoadAll } from "./supabaseClient";

type Role = "Master" | "Admin" | "Wilayat";
type User = { username: string; password: string; role: Role; wilayat: string; label: string };
const DEFAULT_USERS: User[] = [
  { username: "master", password: "Masterin123", role: "Master", wilayat: "All Wilayats", label: "Master" },
  { username: "admin", password: "admin123", role: "Admin", wilayat: "All Wilayats", label: "Admin — Nursing Service Department" },
  { username: "suhar", password: "suhar123", role: "Wilayat", wilayat: "Suhar", label: "Suhar" },
  { username: "saham", password: "saham123", role: "Wilayat", wilayat: "Saham", label: "Saham" },
  { username: "khaboorah", password: "khaboorah123", role: "Wilayat", wilayat: "Khaboorah", label: "Khaboorah" },
  { username: "suwaiq", password: "suwaiq123", role: "Wilayat", wilayat: "Suwaiq", label: "Suwaiq" },
  { username: "shinas", password: "shinas123", role: "Wilayat", wilayat: "Shinas", label: "Shinas" },
  { username: "liwa", password: "liwa123", role: "Wilayat", wilayat: "Liwa", label: "Liwa" },
];
const WILAYAT_ORDER = ["Suhar", "Saham", "Suwaiq", "Khaboorah", "Shinas", "Liwa"];
const INSTITUTIONS: Record<string, string[]> = {
  Suhar: ["Suhar EHC", "Al Uwaynat HC", "Falaj Al Qbail HC", "Multaqa HC", "Suhar MFC", "Traif HC", "Wadi Ahin HC", "Wadi Heebi Hospital", "Suhar RDC"],
  Saham: ["Saham Hospital", "Saham Polyclinic", "Hafeet HC", "Ghuwaisah HC", "Wadi Bani Omar HC", "Saham RDC"],
  Suwaiq: ["Suwaiq Hospital", "Suwaiq EHC", "Bidaya HC", "Khadhra HC", "Mashaiq HC", "Shireesa HC", "Tharmad HC", "Wadi Al Jahawer HC", "Suwaiq RDC"],
  Khaboorah: ["Khaboorah EHC", "Qasbia HC", "Wadi Hawasna Hospital", "Wadi Sarrami Hospital", "Wadi Shafan HC"],
  Shinas: ["Shinas EHC", "Abu Baqra HC", "Shinas Labour Room", "Shinas RDC"],
  Liwa: ["Liwa HC", "Nabr HC", "Rahab HC"],
};
const TOPICS = ["Crash Cart", "Narcotics & Psychotropics", "Escorting Patients", "Death"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_INDEX: Record<string, number> = {};
MONTHS.forEach((m, i) => { MONTH_INDEX[m] = i; MONTH_INDEX[m.toLowerCase()] = i; });
const CATEGORIES = ["General Nursing", "Renal Medicine Center", "Labour Rooms"] as const;

function cleanInstitutionName(raw: string, wilayat?: string): string {
  let s = (raw || "").trim();
  if (s === "Saham Hospital LR") return "Saham Hospital";
  if (s === "Suwaiq Hospital LR") return "Suwaiq Hospital";
  if (s === "Shinas RDC") return "Shinas RMC";
  if (s.endsWith("_Saham Hospital LR")) return "Saham Hospital";
  if (s.endsWith("_Suwaiq Hospital LR")) return "Suwaiq Hospital";
  if (s.endsWith("_Shinas RDC")) return "Shinas RMC"; let changed = true;
  while (changed) { changed = false; const idx = s.indexOf("_"); if (idx > 0) { const prefix = s.slice(0, idx).trim(); const isWilayat = wilayat ? prefix.toLowerCase() === wilayat.toLowerCase() : WILAYAT_ORDER.some(w => w.toLowerCase() === prefix.toLowerCase()); if (isWilayat) { s = s.slice(idx + 1).trim(); changed = true; } } }
  return s;
}
type HistoryEntry = { score: string; comment: string; auditorName: string; auditedAt: string; };
type Plan = { id: string; topic: string; year: number; frequency: string; periods: string[]; active: boolean };
type Score = { id: string; planId: string; wilayat: string; institution: string; topic: string; year: number; period: string; score: string; comment: string; auditorName?: string; auditedAt?: string; history?: HistoryEntry[] };
type PwdOverride = { id: string; username: string; password: string };
type AuditorProfile = { id: string; username: string; lastName: string };
type SecuritySettings = { disabled: string[]; locked: boolean; recoveryCode: string; accessCodeEnabled: boolean; accessCode: string; sessionVersion: number; lastRevocationAt: string; lastRevocationBy: string; showDemoPasswords?: boolean };
type LoginAttempt = { id: string; username: string; success: boolean; status: string; at: string; reason: string };
const DEFAULT_SECURITY: SecuritySettings = { disabled: [], locked: false, recoveryCode: "", accessCodeEnabled: false, accessCode: "", sessionVersion: 1, lastRevocationAt: "", lastRevocationBy: "", showDemoPasswords: false };
type CompPlan = { id: string; category: string; year: number; frequency: string; periods: string[]; procedures: (string | null)[]; feedback?: boolean[]; active: boolean };
type CompScore = { id: string; planId: string; wilayat: string; institution: string; category: string; year: number; period: string; procedure: string; score: string; comment: string; auditorName?: string; auditedAt?: string; history?: HistoryEntry[] };
type InstOverride = { id: string; kind: "add" | "edit" | "delete"; wilayat: string; name: string; assignments: string[]; originalWilayat?: string; originalName?: string };
type ProcOverride = { id: string; kind: "add" | "edit" | "delete"; name: string; originalName?: string };
type EffInst = { wilayat: string; institution: string; assignments: string[]; sourceId?: string; sourceKind?: string; originalWilayat?: string; originalName?: string };
type Block = { start: number; end: number; procedure: string; months: number[] };
const PROCEDURES: string[] = [
  "[LR] 2nd Stage of Labour", "[LR] 3rd Stage of Labour", "[LR] Breast Feeding Assessment", "[LR] Episiotomy Incision, Repair", "[LR] Episiotomy suturing", "[LR] Vaginal Examination",
  "[RMC] Commencing patient with Permanent access to HD Machine", "[RMC] Commencing patient with temporary access to HD Machine", "[RMC] Disconnecting patient with Permanent access from HD Machine", "[RMC] Disconnecting patient with temporary access from HD Machine", "[RMC] Post Dialysis assessment of Haemodialysis Patient", "[RMC] Pre Dialysis assessment of Haemodialysis Patient", "[RMC] Priming Dialysis Machine",
  "Abdominal palpation", "Administering of rectal suppository", "Administering oral medication", "Administraion Phototherapy for new born", "Administrating subcutaneous injection", "Administration of Anticoagulants injection", "Administration of intra dermal injection", "AIR Embolism", "Ambu bag manual ventilator", "Applying O2 mask", "Applying pressure bandage", "Applying wet to dry dressing", "Assessing Pulse rate", "Assisting in Electrocariogram", "Assisting in suturing", "AVF care", "Blood pressure checking", "Blood Transfusion", "Cast Application (Plaster)", "Catheterization", "Cervical Collar", "Cesarean birth Preoperative care", "Checking FHS (fetal heart sound)", "Checking Temperature", "CPR", "CTG", "Diabetic foot dressing", "Documentation", "Dressing for P.cath", "ECG", "Eye irrigation", "First aids of amputated care", "Hand washing", "Incident Report", "Injection preparation", "Inserting Astright Catheter", "Intra muscular injection", "Intradermal Injection", "IV Cannulation Insertion", "IV Fluid Administration", "IV therapy", "Last office procedure", "Lifting and moving technique", "Magnesium Sulphate preparations", "Management & Prevention measure of catheter related to infection", "Management of blood leaking during HD", "Management of Hypertention during & post HD", "Management of hypotension during dialysis", "Management of patient free heparin", "Managemet Of Blood line clotting during HD", "Measuring blood glucose level.", "Measuring Oxygen Saturation", "Metal clip removal", "Mixing medication from two vials", "Narcotic and psychotropic administration", "Nasal Pharangel & Nasal Suction", "Nebulization", "Needle Removal", "Needling", "Neourological assessment", "New-born Examination", "NGT insertion", "O2 Therapy", "Oral / nasal pharyngeal suction", "Oral Medication", "P.Cath dressing", "PPE", "Pulse Oxemeter", "Regulation IV flow rate", "Remove needle", "Removing unsterile gown and gloves", "Stomach wash", "Suction Nose & Mouth", "Suture removal", "Tempreature", "Tracheostomy Care", "Urinary Catheterization (Female)", "Urinary Catheterization (Male)", "vaccination", "Venipuncture for blood collection", "Vital signs", "Waste management", "Wound care / dressing", "Wound stapler removal"
];
function getBlocks(plan: CompPlan | undefined | null): Block[] {
  if (!plan) return []; const blocks: Block[] = []; let i = 0;
  while (i < 12) {
    if (plan.feedback?.[i] || !plan.procedures?.[i]) { i++; continue; }
    const proc = plan.procedures[i]!; let j = i;
    while (j + 1 < 12 && !plan.feedback?.[j + 1] && plan.procedures?.[j + 1] === proc) { j++; }
    const months: number[] = []; for (let k = i; k <= j; k++) months.push(k);
    blocks.push({ start: i, end: j, procedure: proc, months }); i = j + 1;
  }
  return blocks;
}
function blockLabel(b: Block) { return b.start === b.end ? MONTHS[b.start] : `${MONTHS[b.start]}-${MONTHS[b.end]}`; }
function blockForMonth(plan: CompPlan | undefined | null, monthIdx: number): Block | undefined { return getBlocks(plan).find(b => b.months.includes(monthIdx)); }
function formatMuscat(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso); if (isNaN(d.getTime())) return iso;
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Muscat', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
    const parts = fmt.formatToParts(d); const get = (t: string) => parts.find(p => p.type === t)?.value || "";
    return `${get('day')}-${get('month')}-${get('year')} ${get('hour')}:${get('minute')}`;
  } catch { return iso; }
}
function formatLiveTime(iso?: string): string {
  if (!iso) return "—";
  try { const d = new Date(iso); if (isNaN(d.getTime())) return iso; const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Muscat', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); return fmt.format(d); } catch { return iso; }
}
function labelFor(w: string, inst: string) { return cleanInstitutionName(inst, w); }
function scoreColor(s: string) {
  // Never white-on-pale: var(--green) is a pale mint in this theme, so white text on it was invisible (99.7).
  // Use explicit solid colours: dark green + white, light yellow + near-black, dark red + white, amber + near-black.
  if (s === "NA") return { background: "#fbbf24", color: "#111111", fontWeight: 800 };
  const n = parseFloat(s); if (isNaN(n)) return {};
  if (n >= 95) return { background: "#15803d", color: "#ffffff", fontWeight: 800 };
  if (n >= 85) return { background: "#fef08a", color: "#111111", fontWeight: 800 };
  return { background: "#dc2626", color: "#ffffff", fontWeight: 800 };
}
function procTag(p: string) { if (p.startsWith("[LR]")) return "LR"; if (p.startsWith("[RMC]")) return "RMC"; return "General"; }
function stripProcedurePrefix(name: string) { return name.replace(/^\[(LR|RMC)\]\s*/i, "").trim(); }

function xmlEscape(s: string) { return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
function colLetter(idx: number) { let n = idx; let s = ""; while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } return s; }
function isNumericCell(v: string) { if (v === "" || v === null || v === undefined) return false; const t = String(v).trim().toUpperCase(); if (t === "NA" || t === "") return false; const num = Number(t); return !isNaN(num) && isFinite(num); }
function sheetRowsToXml(rows: string[][]): string {
  const maxCols = Math.max(1, ...rows.map(r => r.length));
  const widths: number[] = [];
  for (let ci = 0; ci < maxCols; ci++) { let mx = 10; rows.forEach(r => { const v = String(r[ci] ?? ""); mx = Math.max(mx, Math.min(42, v.length + 2)); }); widths.push(mx); }
  const colsXml = `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w.toFixed(1)}" customWidth="1"/>`).join("")}</cols>`;
  const rowsXml = rows.map((row, ri) => {
    const rNum = ri + 1; const isHeader = ri <= 1;
    const cells = row.map((val, ci) => {
      const col = colLetter(ci); const ref = `${col}${rNum}`;
      if (val === null || val === undefined) val = "";
      const str = String(val); const s = isHeader ? ` s="1"` : ` s="0"`;
      if (isNumericCell(str)) { return `<c r="${ref}"${s}><v>${xmlEscape(str)}</v></c>`; } else { return `<c r="${ref}" t="inlineStr"${s}><is><t xml:space="preserve">${xmlEscape(str)}</t></is></c>`; }
    }).join("");
    return `<row r="${rNum}"${isHeader ? ' ht="20"' : ""}>${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${colsXml}<sheetData>${rowsXml}</sheetData><autoFilter ref="A1:${colLetter(maxCols - 1)}${rows.length}"/></worksheet>`;
}
function makeCRCTable() { const table: number[] = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) { c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); } table[n] = c; } return table; }
const CRC_TABLE = makeCRCTable();
function crc32Bytes(buf: Uint8Array) { let crc = 0 ^ (-1); for (let i = 0; i < buf.length; i++) { crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xFF]; } return (crc ^ (-1)) >>> 0; }
function strToBytes(s: string) { return new TextEncoder().encode(s); }
type ZipFile = { name: string; data: Uint8Array };
function buildZip(files: ZipFile[]): Uint8Array {
  const localParts: number[][] = []; const centralParts: number[][] = []; let offset = 0;
  const writeU16 = (arr: number[], v: number) => { arr.push(v & 0xFF, (v >>> 8) & 0xFF); };
  const writeU32 = (arr: number[], v: number) => { arr.push(v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF); };
  for (const f of files) {
    const nameBytes = strToBytes(f.name); const data = f.data; const crc = crc32Bytes(data);
    const local: number[] = []; writeU32(local, 0x04034b50); writeU16(local, 20); writeU16(local, 0); writeU16(local, 0); writeU16(local, 0); writeU16(local, 0); writeU32(local, crc); writeU32(local, data.length); writeU32(local, data.length); writeU16(local, nameBytes.length); writeU16(local, 0);
    localParts.push(local, Array.from(nameBytes), Array.from(data));
    const central: number[] = []; writeU32(central, 0x02014b50); writeU16(central, 20); writeU16(central, 20); writeU16(central, 0); writeU16(central, 0); writeU16(central, 0); writeU16(central, 0); writeU32(central, crc); writeU32(central, data.length); writeU32(central, data.length); writeU16(central, nameBytes.length); writeU16(central, 0); writeU16(central, 0); writeU16(central, 0); writeU16(central, 0); writeU32(central, 0); writeU32(central, offset);
    centralParts.push(central, Array.from(nameBytes));
    offset += local.length + nameBytes.length + data.length;
  }
  let centralSize = 0; for (const p of centralParts) centralSize += p.length;
  const centralOffset = offset;
  const eocd: number[] = []; writeU32(eocd, 0x06054b50); writeU16(eocd, 0); writeU16(eocd, 0); writeU16(eocd, files.length); writeU16(eocd, files.length); writeU32(eocd, centralSize); writeU32(eocd, centralOffset); writeU16(eocd, 0);
  const totalLen = offset + centralSize + eocd.length;
  const out = new Uint8Array(totalLen); let pos = 0;
  const push = (arr: number[]) => { for (const b of arr) { out[pos++] = b; } };
  for (const p of localParts) push(p);
  for (const p of centralParts) push(p);
  push(eocd);
  return out;
}



function base64ToBytes(b64: string): Uint8Array {
  try {
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return new Uint8Array();
  }
}

function buildDocxBytes(category: string, year: number, seen: string[], rowMonths: number[][], periods: string[], logoDataUrl?: string) {
  const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  const tableRowsXml = seen.map((proc, r) => {
    const isFbRow = proc === "Obtaining Feedback";
    const isSkipRow = proc === "— Skipped —";
    // Use proc directly, no displayProcedure dependency (fixes scope bug that caused "Could not build Word file")
    const procText = (isFbRow || isSkipRow) ? "" : escapeXml(proc || "");
    const serialCell = `<w:tc><w:tcPr><w:tcW w:w="600" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>${r + 1}</w:t></w:r></w:p></w:tc>`;
    const procCell = `<w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:r><w:t>${procText}</w:t></w:r></w:p></w:tc>`;
    const monthCells = periods.map((_, i) => {
      const isPlanned = rowMonths[r].includes(i);
      const shading = isPlanned ? `<w:shd w:val="clear" w:color="auto" w:fill="c9ead9"/>` : "";
      let cellText = "";
      if (isPlanned) {
        if (isFbRow) cellText = "Obtaining feedback";
        else if (isSkipRow) cellText = "Skipped";
      }
      return `<w:tc><w:tcPr><w:tcW w:w="800" w:type="dxa"/>${shading}<w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>${escapeXml(cellText)}</w:t></w:r></w:p></w:tc>`;
    }).join("");
    return `<w:tr>${serialCell}${procCell}${monthCells}</w:tr>`;
  }).join("");

  const headerRow = `<w:tr><w:trPr><w:tblHeader/></w:trPr>
    <w:tc><w:tcPr><w:tcW w:w="600" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="0d6e6b"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Serial</w:t></w:r></w:p></w:tc>
    <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="0d6e6b"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Planned Procedures</w:t></w:r></w:p></w:tc>
    ${periods.map(m => `<w:tc><w:tcPr><w:tcW w:w="800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="0d6e6b"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>${escapeXml(m)}</w:t></w:r></w:p></w:tc>`).join("")}
  </w:tr>`;

  let hasLogo = false;
  let logoB64 = "";
  let logoExt = "jpeg";
  if (logoDataUrl && logoDataUrl.startsWith("data:")) {
    const comma = logoDataUrl.indexOf(",");
    if (comma > -1) {
      const meta = logoDataUrl.substring(5, comma);
      logoB64 = logoDataUrl.substring(comma + 1);
      if (meta.includes("png")) logoExt = "png";
      else if (meta.includes("jpeg") || meta.includes("jpg")) logoExt = "jpeg";
      hasLogo = !!logoB64;
    }
  }

  const logoPara = hasLogo ? `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="1828800" cy="1016000"/><wp:docPr id="1" name="MOH Logo"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="MOH Logo"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1828800" cy="1016000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>` : "";

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>
    ${logoPara}
    <w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>Directorate General of Health Services - NBG</w:t></w:r></w:p>
    <w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>Nursing Service Department</w:t></w:r></w:p>
    <w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:sz w:val="30"/></w:rPr><w:spacing w:after="200"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="30"/></w:rPr><w:t>${escapeXml(category)} Competency Procedures plan ${year}</w:t></w:r></w:p>
    <w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="7a8a88"/><w:left w:val="single" w:sz="4" w:space="0" w:color="7a8a88"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="7a8a88"/><w:right w:val="single" w:sz="4" w:space="0" w:color="7a8a88"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="7a8a88"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="7a8a88"/></w:tblBorders></w:tblPr><w:tblGrid>${["600","3000", ...periods.map(() => "800")].map(w => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>${headerRow}${tableRowsXml}</w:tbl><w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr></w:body></w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const docRels = hasLogo ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.${logoExt}"/></Relationships>` : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="20"/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>`;

  const files: ZipFile[] = [
    { name: "[Content_Types].xml", data: strToBytes(contentTypes) },
    { name: "_rels/.rels", data: strToBytes(rels) },
    { name: "word/_rels/document.xml.rels", data: strToBytes(docRels) },
    { name: "word/document.xml", data: strToBytes(documentXml) },
    { name: "word/styles.xml", data: strToBytes(styles) },
  ];
  if (hasLogo) {
    try {
      const imgBytes = base64ToBytes(logoB64);
      if (imgBytes.length) files.push({ name: `word/media/image1.${logoExt}`, data: imgBytes });
    } catch {}
  }
  return buildZip(files);
}

function sanitizeSheetName(name: string) { let s = name.replace(/[\\/*?:\[\]]/g, "_").slice(0, 31); if (!s) s = "Sheet"; return s; }
function downloadXLSX(filename: string, sheets: { name: string, rows: string[][] }[]) {
  const safeSheets = sheets.map((sh, i) => ({ name: sanitizeSheetName(sh.name || `Sheet${i + 1}`), rows: sh.rows }));
  const contentTypesOverrides = safeSheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${contentTypesOverrides}</Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${safeSheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${safeSheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${safeSheets.map((sh, i) => `<sheet name="${xmlEscape(sh.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F766E"/><bgColor rgb="FF0F766E"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0"><alignment horizontal="center" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const files: ZipFile[] = [
    { name: "[Content_Types].xml", data: strToBytes(contentTypes) },
    { name: "_rels/.rels", data: strToBytes(rels) },
    { name: "xl/_rels/workbook.xml.rels", data: strToBytes(workbookRels) },
    { name: "xl/workbook.xml", data: strToBytes(workbook) },
    { name: "xl/styles.xml", data: strToBytes(styles) },
  ];
  safeSheets.forEach((sh, i) => {
    const xml = sheetRowsToXml(sh.rows);
    files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: strToBytes(xml) });
  });
  const zipBytes = buildZip(files);
  const zipCopy: Uint8Array<ArrayBuffer> = new Uint8Array(zipBytes);
  const blob = new Blob([zipCopy.buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
  if (isIOS) {
    try { setTimeout(() => window.open(url, "_blank"), 350); } catch {}
  }
  setTimeout(() => { try { document.body.removeChild(a); } catch {} URL.revokeObjectURL(url); }, isIOS ? 6000 : 2000);
}

const DEFAULT_PLANS: Plan[] = TOPICS.map(t => ({ id: `default-plan-${t}`, topic: t, year: 2027, frequency: "Monthly", periods: [...MONTHS], active: true }));
const DEFAULT_COMP_PLANS: CompPlan[] = [
  { id: "default-comp-General Nursing", category: "General Nursing", year: 2027, frequency: "Monthly", periods: [...MONTHS], procedures: ["Neourological assessment", "Neourological assessment", "Neourological assessment", "Urinary Catheterization (Male)", "Urinary Catheterization (Male)", null, "IV Cannulation Insertion", "IV Cannulation Insertion", "IV Fluid Administration", "Cast Application (Plaster)", null, null], feedback: [false, false, false, false, false, true, false, false, false, false, false, false], active: true },
  { id: "default-comp-Renal Medicine Center", category: "Renal Medicine Center", year: 2027, frequency: "Monthly", periods: [...MONTHS], procedures: ["[RMC] Pre Dialysis assessment of Haemodialysis Patient", "[RMC] Pre Dialysis assessment of Haemodialysis Patient", "[RMC] Priming Dialysis Machine", "[RMC] Priming Dialysis Machine", null, "[RMC] Commencing patient with Permanent access to HD Machine", "[RMC] Commencing patient with Permanent access to HD Machine", "[RMC] Post Dialysis assessment of Haemodialysis Patient", "[RMC] Disconnecting patient with Permanent access from HD Machine", null, "[RMC] Management of hypotension during dialysis", null], feedback: [false, false, false, false, true, false, false, false, false, false, false, false], active: true },
  { id: "default-comp-Labour Rooms", category: "Labour Rooms", year: 2027, frequency: "Monthly", periods: [...MONTHS], procedures: ["[LR] Vaginal Examination", "[LR] Vaginal Examination", "[LR] 2nd Stage of Labour", "[LR] 2nd Stage of Labour", null, "[LR] 3rd Stage of Labour", "[LR] 3rd Stage of Labour", "[LR] Episiotomy Incision, Repair", "[LR] Breast Feeding Assessment", "Checking FHS (fetal heart sound)", null, null], feedback: [false, false, false, false, true, false, false, false, false, false, false, false], active: true },
];
const DEFAULT_SCORES: Score[] = [
  { id: "default-score-1", planId: "default-plan-Crash Cart", wilayat: "Suhar", institution: "Suhar EHC", topic: "Crash Cart", year: 2027, period: "Jan", score: "95", comment: "Crash cart checklist complete.", auditorName: "Salim Al Mamari", auditedAt: "2026-11-22T03:42:00.000Z", history: [] },
  { id: "default-score-2", planId: "default-plan-Crash Cart", wilayat: "Suhar", institution: "Suhar EHC", topic: "Crash Cart", year: 2027, period: "Feb", score: "98", comment: "Minor labelling fixed on site.", auditorName: "Salim Al Mamari", auditedAt: "2026-11-22T04:10:00.000Z", history: [] },
];
const DEFAULT_COMP_SCORES: CompScore[] = [
  { id: "default-comp-score-1", planId: "default-comp-General Nursing", wilayat: "Khaboorah", institution: "Khaboorah EHC", category: "General Nursing", year: 2027, period: "Jan", procedure: "Neourological assessment", score: "92", comment: "Good technique.", auditorName: "Salim Al Mamari", auditedAt: "2026-11-22T03:42:00.000Z", history: [] },
];

async function api(action: string, args: any) {
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch("actions", { method: "POST", cache: "no-store", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, args }), signal: ctrl.signal });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) {
      throw new Error(json.error || `Request failed (${res.status})`);
    }
    return json.data;
  } finally { clearTimeout(timer); }
}

// No browser fallback: a failed shared-backend write must
// surface as an error, never look saved on one device only.
function saveLocalBackup(_state: any) {}
function loadLocalBackup(): any | null { return null; }

export default function App() {
  useEffect(() => { document.title = "NBG - Nursing Audit System"; }, []);
  // Login persistence: per-device localStorage (NOT Supabase).
  // Supabase row "audit_current_user" was shared for everyone, so one
  // device logging in overwrote another device's login. localStorage
  // keeps Saham logged in on iPhone and Admin logged in on laptop.
  // Only username + sessionVersion are saved, never a password.
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('audit_current_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      const found = DEFAULT_USERS.find(u => u.username === String(parsed.username || '').toLowerCase());
      return found || null;
    } catch { return null; }
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [part, setPart] = useState<"1" | "2">("1");
  const [tab, setTab] = useState("Dashboard");
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [scores, setScores] = useState<Score[]>(DEFAULT_SCORES);
  const [overrides, setOverrides] = useState<PwdOverride[]>([]);
  const [compPlans, setCompPlans] = useState<CompPlan[]>(DEFAULT_COMP_PLANS);
  const [compScores, setCompScores] = useState<CompScore[]>(DEFAULT_COMP_SCORES);
  const [planTombstones, setPlanTombstones] = useState<string[]>(() => {
    try { const s = localStorage.getItem('audit_tombstones_plans'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [compPlanTombstones, setCompPlanTombstones] = useState<string[]>(() => {
    try { const s = localStorage.getItem('audit_tombstones_compPlans'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [instOverrides, setInstOverrides] = useState<InstOverride[]>([]);
  const [yearAssignments, setYearAssignments] = useState<Record<string, string[]>>({});
  const [assignYear, setAssignYear] = useState<number>(2027);
  const [procOverrides, setProcOverrides] = useState<ProcOverride[]>([]);
  const [auditorProfiles, setAuditorProfiles] = useState<AuditorProfile[]>([]);
  const [security, setSecurity] = useState<SecuritySettings>(DEFAULT_SECURITY);
  const [securityId, setSecurityId] = useState<string>("");
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [userSessionVersion, setUserSessionVersion] = useState<number | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [recoveryInput, setRecoveryInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [planId, setPlanId] = useState("");
  const [wilayatFilter, setWilayatFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedCell, setSelectedCell] = useState<{ wilayat: string; institution: string; period: string; part?: string; category?: string } | null>(null);
  const [scoreInput, setScoreInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [auditorNameInput, setAuditorNameInput] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [pwdForm, setPwdForm] = useState({ username: "suhar", password: "" });
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [compPlanId, setCompPlanId] = useState("");
  const [newPlan, setNewPlan] = useState({ topic: TOPICS[0], year: 2027 });
  const [newCompPlan, setNewCompPlan] = useState({ category: CATEGORIES[0] as string, year: 2027, procedures: Array(12).fill(null) as (string | null)[], feedback: Array(12).fill(false) as boolean[] });
  const [compProcSearch, setCompProcSearch] = useState<(string | undefined)[]>(Array(12).fill(undefined as any));
  const [openProcIdx, setOpenProcIdx] = useState<number | null>(null);
  const [editingCompPlanId, setEditingCompPlanId] = useState("");
  const setCompMonth = (idx: number, kind: "skip" | "feedback" | "procedure", proc?: string) => {
    setNewCompPlan(prev => {
      const procs = [...prev.procedures]; const fbs = [...prev.feedback];
      if (kind === "skip") { procs[idx] = null; fbs[idx] = false; }
      else if (kind === "feedback") { procs[idx] = null; fbs[idx] = true; }
      else if (kind === "procedure") { procs[idx] = proc || null; fbs[idx] = false; }
      return { ...prev, procedures: procs, feedback: fbs };
    });
  };
  const [editingProcedures, setEditingProcedures] = useState<(string | null)[]>([]);
  const [editingFeedback, setEditingFeedback] = useState<boolean[]>([]);
  const [instForm, setInstForm] = useState({ wilayat: "Suhar", name: "", assignments: ["Part 1"] as string[] });
  const [editingInst, setEditingInst] = useState<EffInst | null>(null);
  const [instMsg, setInstMsg] = useState("");
  const [procForm, setProcForm] = useState({ name: "", tag: "General" });
  const [editingProc, setEditingProc] = useState<{ name: string; sourceId?: string; sourceKind?: string; originalName?: string } | null>(null);
  const [procMsg, setProcMsg] = useState("");
  const [procSearch, setProcSearch] = useState("");
  const [procFilterTag, setProcFilterTag] = useState("All");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());
  const [liveStatus, setLiveStatus] = useState<"live" | "offline" | "refreshing">("live");
  const [liveToast, setLiveToast] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [securityMsg, setSecurityMsg] = useState("");
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [supabaseReason, setSupabaseReason] = useState("");
  const [syncRowsLoaded, setSyncRowsLoaded] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState("");
  const [viewportWidth, setViewportWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const [singleMonthView, setSingleMonthView] = useState(false);
  const [mobileMonthIdx, setMobileMonthIdx] = useState(() => new Date().getMonth());
  const gridRef = React.useRef<HTMLDivElement | null>(null);

  const GUIDE_TEXT = `Wilayat Quick Guide — How to Enter Scores on Your Phone
1. Open shared link, log in with Wilayat account (e.g. suhar / suhar123)
2. Choose Part 1 or Part 2 at top
3. Choose Year and Topic/Category
4. In Audit Grid, swipe sideways to see months. Turn ON Single month view for easiest entry.
5. Tap a cell (e.g. Saham Hospital • Jan) -> bottom sheet opens: enter Score (0-100 or NA), Your Name mandatory, Comment optional, Save.
6. To edit, tap same cell again.
7. Tap Refresh at top to see latest scores from other Wilayats.
8. Check Dashboard for completion %.`;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => { window.removeEventListener("resize", onResize); window.removeEventListener("orientationchange", onResize); };
  }, []);

  const effectiveUsers = useMemo(() => DEFAULT_USERS.map(u => { const o = overrides.find(x => x.username === u.username); return o ? { ...u, password: o.password } : u; }), [overrides]);

  const effInstList = useMemo<EffInst[]>(() => {
    const map = new Map<string, EffInst>();
    const setEntry = (wilayat: string, institution: string, assignments: string[], source?: Partial<EffInst>) => {
      const clean = cleanInstitutionName(institution, wilayat);
      const key = `${wilayat}||${clean.toLowerCase()}`;
      const existing = map.get(key);
      if (existing) {
        const merged = [...new Set([...existing.assignments, ...assignments])];
        map.set(key, { ...existing, assignments: merged, ...(source || {}) });
      } else {
        map.set(key, { wilayat, institution: clean, assignments: [...assignments], ...(source || {}) });
      }
    };
    Object.entries(INSTITUTIONS).forEach(([w, list]) => list.forEach(inst => setEntry(w, inst, ["Part 1"])));
    const COMP_INSTITUTIONS_RAW: Record<string, string[]> = {
      "General Nursing": ["Khaboorah_Khaboorah EHC", "Khaboorah_Qasbia HC", "Khaboorah_Wadi Hawasna Hospital", "Khaboorah_Wadi Sarrami Hospital", "Khaboorah_Wadi Shafan HC", "Liwa_Liwa HC", "Liwa_Nabr HC", "Liwa_Rahab HC", "Saham_Saham Hospital", "Saham_Saham Polyclinic", "Saham_Ghuwaisah HC", "Saham_Hafeet HC", "Saham_Wadi Bani Omar HC", "Shinas_Abu Baqra HC", "Shinas_Shinas EHC", "Suhar_Al Uwaynat HC", "Suhar_Falaj Al Qbail HC", "Suhar_Multaqa HC", "Suhar_Suhar EHC", "Suhar_Suhar MFC", "Suhar_Traif HC", "Suhar_Wadi Ahin HC", "Suhar_Wadi Heebi Hospital", "Suwaiq_Suwaiq Hospital", "Suwaiq_Bidaya HC", "Suwaiq_Khadhra HC", "Suwaiq_Mashaiq HC", "Suwaiq_Shireesa HC", "Suwaiq_Suwaiq EHC", "Suwaiq_Tharmad HC", "Suwaiq_Wadi Al Jahawer HC"],
      "Renal Medicine Center": ["Suhar_Suhar RMC", "Saham_Saham RMC", "Suwaiq_Suwaiq RMC", "Shinas_Shinas RMC"],
      "Labour Rooms": ["Saham_Saham Hospital", "Shinas_Shinas LR", "Suwaiq_Suwaiq Hospital"],
    };
    Object.entries(COMP_INSTITUTIONS_RAW).forEach(([cat, list]) => list.forEach(s => { const i = s.indexOf("_"); setEntry(s.slice(0, i), s.slice(i + 1), [cat]); }));
    instOverrides.forEach(rec => {
      if (rec.kind === "delete") {
        const origW = rec.originalWilayat || rec.wilayat; const origN = cleanInstitutionName(rec.originalName || rec.name, origW); map.delete(`${origW}||${origN.toLowerCase()}`);
      } else if (rec.kind === "add") {
        const clean = cleanInstitutionName(rec.name, rec.wilayat); map.set(`${rec.wilayat}||${clean.toLowerCase()}`, { wilayat: rec.wilayat, institution: clean, assignments: [...(rec.assignments || [])], sourceId: rec.id, sourceKind: "add", originalWilayat: rec.wilayat, originalName: clean });
      } else if (rec.kind === "edit") {
        const origW = rec.originalWilayat || rec.wilayat; const origN = cleanInstitutionName(rec.originalName || rec.name, origW); map.delete(`${origW}||${origN.toLowerCase()}`); const clean = cleanInstitutionName(rec.name, rec.wilayat); map.set(`${rec.wilayat}||${clean.toLowerCase()}`, { wilayat: rec.wilayat, institution: clean, assignments: [...(rec.assignments || [])], sourceId: rec.id, sourceKind: "edit", originalWilayat: origW, originalName: origN });
      }
    });
    return [...map.values()].sort((a, b) => WILAYAT_ORDER.indexOf(a.wilayat) - WILAYAT_ORDER.indexOf(b.wilayat) || a.institution.localeCompare(b.institution));
  }, [instOverrides]);

  const effPart1 = useMemo<Record<string, string[]>>(() => {
    const out: Record<string, string[]> = {}; WILAYAT_ORDER.forEach(w => { out[w] = effInstList.filter(e => e.wilayat === w && e.assignments.includes("Part 1")).map(e => e.institution).sort((a, b) => a.localeCompare(b)); }); return out;
  }, [effInstList]);
  const effComp = useMemo<Record<string, { wilayat: string; institution: string }[]>>(() => {
    const out: Record<string, { wilayat: string; institution: string }[]> = {}; CATEGORIES.forEach(cat => { out[cat] = effInstList.filter(e => e.assignments.includes(cat)).map(e => ({ wilayat: e.wilayat, institution: e.institution })).sort((a, b) => WILAYAT_ORDER.indexOf(a.wilayat) - WILAYAT_ORDER.indexOf(b.wilayat) || a.institution.localeCompare(b.institution)); }); return out;
  }, [effInstList]);
  const effectiveProcedures = useMemo<string[]>(() => {
    const map = new Map<string, { name: string }>(); PROCEDURES.forEach(p => map.set(p.toLowerCase(), { name: p }));
    procOverrides.forEach(rec => {
      if (rec.kind === "delete") { map.delete((rec.originalName || rec.name).toLowerCase()); }
      else if (rec.kind === "add") { map.set(rec.name.toLowerCase(), { name: rec.name }); }
      else if (rec.kind === "edit") { map.delete((rec.originalName || rec.name).toLowerCase()); map.set(rec.name.toLowerCase(), { name: rec.name }); }
    });
    return [...map.values()].map(v => v.name);
  }, [procOverrides]);
  const displayProcedure = (proc: string | null | undefined): string => { if (!proc) return "— Skipped —"; const exists = effectiveProcedures.some(p => p.toLowerCase() === proc.toLowerCase()); return exists ? proc : "(Removed procedure)"; };

  const applySupabaseRows = (rows: any[]) => {
    if (!rows || rows.length === 0) return false;
    // Merge rule: shared database wins. Sort oldest -> newest by updated_at
    // so that when the same logical record exists twice (two devices saved
    // the same cell), the newest copy is the one kept below.
    const sortedRows = [...rows].sort((a: any, b: any) => {
      const ta = a?.updated_at ? new Date(a.updated_at).getTime() : 0;
      const tb = b?.updated_at ? new Date(b.updated_at).getTime() : 0;
      return ta - tb;
    });
    rows = sortedRows;
    let hasData = false;
    const newPlans: Plan[] = []; const newScores: Score[] = []; const newCompPlans: CompPlan[] = []; const newCompScores: CompScore[] = [];
    const newInst: InstOverride[] = []; const newProc: ProcOverride[] = []; const newPwd: PwdOverride[] = []; const newAuditor: AuditorProfile[] = [];
    const newYearAssign: Record<string, string[]> = {};
    let newSecurity: SecuritySettings | null = null; let newSecId = ""; const newAttempts: LoginAttempt[] = [];
    let sessionCandidate: { username: string; sessionVersion: number } | null = null;
    const newPlanTombstones: string[] = [];
    const newCompPlanTombstones: string[] = [];
    rows.forEach(r => {
      const id = r.id || ""; const d = r.data || {};
      try {
        if (id === "audit_current_user" || id.startsWith("audit_session")) { /* IGNORED: login is per-device localStorage, shared row must never overwrite this device's login. */ return; }
        if (id.startsWith("audit_tombstones_")) {
          // Tombstone row: data = { kind: 'plan'|'compPlan', key: 'Topic||Year' }
          const kind = d.kind; const key = d.key;
          if (kind === "plan" && key) newPlanTombstones.push(key);
          else if (kind === "compPlan" && key) newCompPlanTombstones.push(key);
          else if (id.includes("_plan_") && d.key) newPlanTombstones.push(d.key);
          else if (id.includes("_compPlan_") && d.key) newCompPlanTombstones.push(d.key);
          hasData = true;
          return;
        }
        if (id.includes("institution_assignments_")) {
          const wil = d.wilayat; let inst = d.institution; const yr = d.year;
          // Legacy rename: Saham Hospital LR -> Saham Hospital, Suwaiq Hospital LR -> Suwaiq Hospital, Shinas RDC -> Shinas RMC
          if (inst === "Saham Hospital LR") inst = "Saham Hospital";
          if (inst === "Suwaiq Hospital LR") inst = "Suwaiq Hospital";
          if (inst === "Shinas RDC") inst = "Shinas RMC";
          if (wil && inst && yr) {
            const k = `${wil}||${inst}||${yr}`;
            newYearAssign[k] = Array.isArray(d.assignments) ? d.assignments : [];
          }
          hasData = true;
          return;
        }
        // Aggregate rows: one row whose data is the whole collection.
        if ((id === "audit_scores" || id === "audit_plans" || id === "audit_institutions" || id === "audit_procedures" || id === "audit_users") && Array.isArray(d)) {
          hasData = true;
          if (id === "audit_scores") d.forEach((item: any) => { if (item) newScores.push({ id: item.id || `agg-${Date.now()}-${Math.random()}`, planId: item.planId, wilayat: item.wilayat, institution: cleanInstitutionName(item.institution, item.wilayat), topic: item.topic, year: item.year, period: item.period, score: item.score, comment: item.comment, auditorName: item.auditorName, auditedAt: item.auditedAt, history: item.history || [] }); });
          if (id === "audit_plans") d.forEach((item: any) => { if (item) newPlans.push({ id: item.id || `agg-plan-${Date.now()}`, topic: item.topic, year: item.year, frequency: item.frequency || "Monthly", periods: item.periods || [...MONTHS], active: !!item.active }); });
          if (id === "audit_institutions") d.forEach((item: any) => { if (!item) return; if (item.kind) newInst.push({ id: item.id || `agg-inst-${Date.now()}-${Math.random()}`, kind: item.kind, wilayat: item.wilayat, name: item.name, assignments: item.assignments || [], originalWilayat: item.originalWilayat, originalName: item.originalName }); else newInst.push({ id: `agg-inst-${Date.now()}-${Math.random()}`, kind: "add", wilayat: item.wilayat, name: item.institution || item.name, assignments: item.assignments || ["Part 1"], originalWilayat: item.wilayat, originalName: item.institution || item.name }); });
          if (id === "audit_procedures") d.forEach((item: any) => { if (!item) return; if (typeof item === "string") newProc.push({ id: `agg-proc-${Date.now()}-${Math.random()}`, kind: "add", name: item }); else if (item.kind) newProc.push({ id: item.id || `agg-proc-${Date.now()}-${Math.random()}`, kind: item.kind, name: item.name, originalName: item.originalName }); else newProc.push({ id: `agg-proc-${Date.now()}-${Math.random()}`, kind: "add", name: item.name }); });
          if (id === "audit_users") d.forEach((item: any) => { if (item?.username && item?.password) newPwd.push({ id: item.id || `agg-user-${item.username}`, username: item.username, password: item.password }); });
          return;
        }
        // V5 FIX: Part 1 scores MUST be checked BEFORE plans. Old code checked
        // plans first with (topic && year) — every Part 1 score has topic+year,
        // so scores were misfiled as plans and never appeared on other devices.
        // Part 2 worked because its scores have no topic. Plans now match ONLY by ID.
        if (id.startsWith("audit_scores_") || (d.wilayat && d.institution && d.period && d.topic && (d.score !== undefined || d.planId))) { newScores.push({ id: d.id || id, planId: d.planId, wilayat: d.wilayat, institution: cleanInstitutionName(d.institution, d.wilayat), topic: d.topic, year: d.year, period: d.period, score: d.score, comment: d.comment, auditorName: d.auditorName, auditedAt: d.auditedAt, history: d.history || [] }); hasData = true; }
        else if (id.startsWith("audit_plans_")) { newPlans.push({ id: d.id || id, topic: d.topic, year: d.year, frequency: d.frequency || "Monthly", periods: d.periods || [...MONTHS], active: !!d.active }); hasData = true; }
        else if (id.startsWith("competency_plans_") || (d.category && d.procedures)) { newCompPlans.push({ id: d.id || id, category: d.category, year: d.year, frequency: d.frequency || "Monthly", periods: d.periods || [...MONTHS], procedures: d.procedures || Array(12).fill(null), feedback: d.feedback || Array(12).fill(false), active: !!d.active }); hasData = true; }
        else if (id.startsWith("competency_scores_") || (d.wilayat && d.procedure && d.category)) { newCompScores.push({ id: d.id || id, planId: d.planId, wilayat: d.wilayat, institution: cleanInstitutionName(d.institution, d.wilayat), category: d.category, year: d.year, period: d.period, procedure: d.procedure, score: d.score, comment: d.comment, auditorName: d.auditorName, auditedAt: d.auditedAt, history: d.history || [] }); hasData = true; }
        else if (id.startsWith("audit_institutions_")) { newInst.push({ id: d.id || id, kind: d.kind, wilayat: d.wilayat, name: d.name, assignments: d.assignments || [], originalWilayat: d.originalWilayat, originalName: d.originalName }); hasData = true; }
        else if (id.startsWith("audit_procedures_")) { newProc.push({ id: d.id || id, kind: d.kind, name: d.name, originalName: d.originalName }); hasData = true; }
        else if (id.startsWith("audit_passwords_") || (d.username && d.password)) { newPwd.push({ id: d.id || id, username: d.username, password: d.password }); hasData = true; }
        else if (id.startsWith("audit_auditor_names_")) { newAuditor.push({ id: d.id || id, username: d.username, lastName: d.lastName }); hasData = true; }
        else if (id.startsWith("audit_security") || d.disabled || d.recoveryCode !== undefined) { newSecurity = { ...DEFAULT_SECURITY, ...d, disabled: Array.isArray(d.disabled) ? d.disabled : [] }; newSecId = d.id || id; hasData = true; }
        else if (id.startsWith("audit_login_attempts_")) { newAttempts.push({ id: d.id || id, username: d.username, success: d.success, status: d.status, at: d.at, reason: d.reason }); }
      } catch {}
    });
    // Restore a persisted login only on a fresh load (no user yet). The
    // effective security + overrides from this same batch decide whether
    // the saved session is still valid.
    if (sessionCandidate && !user) {
      const effSecurity = newSecurity || security;
      const candidateUser = DEFAULT_USERS.find(u => u.username === sessionCandidate.username);
      if (candidateUser && sessionCandidate.sessionVersion === effSecurity.sessionVersion && !effSecurity.disabled.includes(candidateUser.username) && !(effSecurity.locked && candidateUser.role !== "Master")) {
        setUser(candidateUser);
        setUserSessionVersion(sessionCandidate.sessionVersion);
        setTab("Dashboard");
      }
    }
    // De-duplicate by logical key, keeping the newest (last, after the
    // updated_at sort above) so a second device's newer save wins over an
    // older copy of the same cell / plan instead of showing both.
    const dedupBy = <T,>(arr: T[], key: (v: T) => string): T[] => {
      const m = new Map<string, T>();
      arr.forEach((v) => m.set(key(v), v));
      return [...m.values()];
    };
    // FIXED V7: dedup plans by newest updated_at (sortedRows is oldest->newest), keep last value.
    // Do NOT OR active - intentional deactivation must stick. Newest row wins.
    // Merge persistent tombstones from this batch into state + localStorage
    if (newPlanTombstones.length) {
      setPlanTombstones(prev => {
        const merged = [...new Set([...prev, ...newPlanTombstones])];
        try { localStorage.setItem('audit_tombstones_plans', JSON.stringify(merged)); } catch {}
        return merged;
      });
    }
    if (newCompPlanTombstones.length) {
      setCompPlanTombstones(prev => {
        const merged = [...new Set([...prev, ...newCompPlanTombstones])];
        try { localStorage.setItem('audit_tombstones_compPlans', JSON.stringify(merged)); } catch {}
        return merged;
      });
    }
    // Clean old in-memory tombstones
    const nowDelCheck = Date.now();
    for (const [k, ts] of recentlyDeletedRef.current.entries()) { if (nowDelCheck - ts > 60000) recentlyDeletedRef.current.delete(k); }
    const isRecentlyDeleted = (id: string, logicalKey: string) => {
      return recentlyDeletedRef.current.has(id) || recentlyDeletedRef.current.has(logicalKey);
    };
    const allPlanTombstones = [...new Set([...planTombstones, ...newPlanTombstones])];
    const allCompPlanTombstones = [...new Set([...compPlanTombstones, ...newCompPlanTombstones])];
    const dedupedPlansRaw = (() => { const m = new Map<string, any>(); newPlans.forEach(v => { const k = `${v.topic}||${v.year}`; m.set(k, v); }); return [...m.values()]; })();
    const dedupedCompPlansRaw = (() => { const m = new Map<string, any>(); newCompPlans.forEach(v => { const k = `${v.category}||${v.year}`; m.set(k, v); }); return [...m.values()]; })();
    const dedupedPlans = dedupedPlansRaw.filter((v: any) => {
      const key = `${v.topic}||${v.year}`;
      return !isRecentlyDeleted(v.id, key) && !allPlanTombstones.includes(key);
    });
    const dedupedCompPlans = dedupedCompPlansRaw.filter((v: any) => {
      const key = `${v.category}||${v.year}`;
      return !isRecentlyDeleted(v.id, key) && !allCompPlanTombstones.includes(key);
    });
    const dedupedScores = dedupBy(newScores, (s) => `${s.planId}||${s.wilayat}||${s.institution}||${s.period}`);
    const dedupedCompScores = dedupBy(newCompScores, (s) => `${s.planId}||${s.wilayat}||${s.institution}||${s.period}`);
    // MERGE, never replace: a fetch that runs seconds after a save may not yet
    // include that just-saved row. Replacing would wipe it from the screen.
    // Merge keeps local scores not yet in Supabase, Supabase wins on conflict.
    // PLAN-ID FIX: if Supabase returns the same Crash Cart plan with a different
    // id, scores saved under the old id would become invisible (grid filters by
    // planId). So merge scores by wilayat||institution||period||topic, ignoring
    // planId, and keep the local plan id. Never let a plan copy hide a score.
    if (dedupedScores.length) setScores(prev => { const m = new Map(prev.map(x => [`${x.wilayat}||${x.institution}||${x.period}||${x.topic || ''}`, x])); dedupedScores.forEach(x => { const k = `${x.wilayat}||${x.institution}||${x.period}||${x.topic || ''}`; const existing = m.get(k); m.set(k, existing ? { ...x, planId: existing.planId, id: existing.id } : x); }); return [...m.values()]; });
    if (dedupedPlans.length) setPlans(prev => { const m = new Map(prev.map(x => [`${x.topic}||${x.year}`, x])); dedupedPlans.forEach(x => { const k = `${x.topic}||${x.year}`; const existing = m.get(k); if (existing) { /* Supabase wins, but keep local id for score linkage */ m.set(k, { ...x, id: existing.id }); } else { m.set(k, x); } }); return [...m.values()]; });
    if (dedupedCompPlans.length) setCompPlans(prev => { const m = new Map(prev.map(x => [`${x.category}||${x.year}`, x])); dedupedCompPlans.forEach(x => { const k = `${x.category}||${x.year}`; const existing = m.get(k); if (existing) { m.set(k, { ...x, id: existing.id }); } else { m.set(k, x); } }); return [...m.values()]; });
    if (dedupedCompScores.length) setCompScores(prev => { const m = new Map(prev.map(x => [`${x.wilayat}||${x.institution}||${x.period}||${x.category || ''}`, x])); dedupedCompScores.forEach(x => { const k = `${x.wilayat}||${x.institution}||${x.period}||${x.category || ''}`; const existing = m.get(k); m.set(k, existing ? { ...x, planId: existing.planId, id: existing.id } : x); }); return [...m.values()]; });
    if (newInst.length) setInstOverrides(newInst);
    if (Object.keys(newYearAssign).length) setYearAssignments(prev => ({ ...prev, ...newYearAssign }));
    if (newProc.length) setProcOverrides(newProc);
    if (newPwd.length) setOverrides(newPwd);
    if (newAuditor.length) setAuditorProfiles(newAuditor);
    if (newSecurity) { setSecurity(newSecurity); setSecurityId(newSecId); }
    if (newAttempts.length) setLoginAttempts(newAttempts.sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime()));
    return hasData;
  };

  const loadFromSupabase = async (): Promise<boolean> => {
    if (!isSupabaseConfigured) { setSupabaseConnected(false); setSupabaseReason("no-config"); return false; }
    setLiveStatus("refreshing");
    const res = await sbLoadAll();
    const now = new Date().toISOString();
    if (!res.ok) {
      setSupabaseConnected(false); setSupabaseReason(res.reason || "unknown"); setLiveStatus("offline");
      setLiveToast(`Supabase not connected: ${res.reason || "unknown"} — showing local data only`);
      return false;
    }
    setSupabaseConnected(true); setSupabaseReason(""); setSyncRowsLoaded(res.rows.length); setLastSyncAt(now); setLastUpdatedAt(now); setLiveStatus("live"); setBackendError("");
    if (res.rows.length === 0) { return true; }
    const ok = applySupabaseRows(res.rows);
    if (ok) { saveLocalBackup({ plans, scores, compPlans, compScores, instOverrides, procOverrides, overrides, auditorProfiles, security }); }
    return true;
  };

  const reloadRecords = async (): Promise<boolean> => {
    if (isSupabaseConfigured) {
      const ok = await loadFromSupabase();
      if (ok) return true;
      // Shared fetch failed: fall through to the records-API path below
      // instead of clearing state, and never touch the logged-in user.
    }
    try {
      const cols = ["audit_plans", "audit_scores", "audit_passwords", "competency_plans", "competency_scores", "audit_institutions", "audit_procedures", "audit_auditor_names", "audit_security", "audit_login_attempts"];
      const raw = await Promise.all(cols.map(c => api("records.list", { collection: c }).catch(() => ({ records: [] }))));
      const byIdx = (i: number) => (raw[i] as any)?.records || [];
      const p = byIdx(0).map((r: any) => ({ id: r.id, topic: r.value.topic, year: r.value.year, frequency: r.value.frequency || "Monthly", periods: r.value.periods || [...MONTHS], active: !!r.value.active }));
      const s = byIdx(1).map((r: any) => ({ id: r.id, ...r.value, institution: cleanInstitutionName(r.value.institution, r.value.wilayat) }));
      const o = byIdx(2).map((r: any) => ({ id: r.id, ...r.value }));
      const cp = byIdx(3).map((r: any) => ({ id: r.id, category: r.value.category, year: r.value.year, frequency: r.value.frequency || "Monthly", periods: r.value.periods || [...MONTHS], procedures: r.value.procedures || Array(12).fill(null), feedback: r.value.feedback || Array(12).fill(false), active: !!r.value.active }));
      const cs = byIdx(4).map((r: any) => ({ id: r.id, ...r.value, institution: cleanInstitutionName(r.value.institution, r.value.wilayat) }));
      const io = byIdx(5).map((r: any) => ({ id: r.id, ...r.value }));
      const po = byIdx(6).map((r: any) => ({ id: r.id, ...r.value }));
      const ap = byIdx(7).map((r: any) => ({ id: r.id, ...r.value }));
      const secRec = byIdx(8)[0]; const sec = secRec ? { ...DEFAULT_SECURITY, ...secRec.value, disabled: Array.isArray(secRec.value?.disabled) ? secRec.value.disabled : [] } : DEFAULT_SECURITY;
      const att = byIdx(9).map((r: any) => ({ id: r.id, ...r.value })).sort((a: any, b: any) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime());
      if (p.length) setPlans(prev => { const m = new Map(prev.map((x:any)=>[`${x.topic}||${x.year}`, x])); p.forEach((x:any)=>m.set(`${x.topic}||${x.year}`, x)); return [...m.values()]; }); if (s.length) setScores(prev => { const m = new Map(prev.map((x:any)=>[`${x.planId}||${x.wilayat}||${x.institution}||${x.period}`, x])); s.forEach((x:any)=>m.set(`${x.planId}||${x.wilayat}||${x.institution}||${x.period}`, x)); return [...m.values()]; }); if (o.length) setOverrides(o); if (cp.length) setCompPlans(cp); if (cs.length) setCompScores(cs); if (io.length) setInstOverrides(io); if (po.length) setProcOverrides(po); if (ap.length) setAuditorProfiles(ap); setSecurity(sec); setSecurityId(secRec ? secRec.id : ""); setLoginAttempts(att);
      const now = new Date().toISOString(); setLastUpdatedAt(now); setLiveStatus("live");
      saveLocalBackup({ plans: p.length ? p : plans, scores: s.length ? s : scores, compPlans: cp.length ? cp : compPlans, compScores: cs.length ? cs : compScores, instOverrides: io, procOverrides: po, overrides: o, auditorProfiles: ap, security: sec });
      return true;
    } catch {
      const backup = loadLocalBackup();
      if (backup) {
        if (backup.plans) setPlans(backup.plans); if (backup.scores) setScores(backup.scores); if (backup.compPlans) setCompPlans(backup.compPlans); if (backup.compScores) setCompScores(backup.compScores);
        if (backup.overrides) setOverrides(backup.overrides); if (backup.instOverrides) setInstOverrides(backup.instOverrides); if (backup.procOverrides) setProcOverrides(backup.procOverrides);
        if (backup.security) setSecurity(backup.security);
        setLiveStatus("offline");
      } else {
        setLiveStatus("offline");
      }
      return false;
    }
  };

  useEffect(() => { (async () => { await reloadRecords(); })(); }, []);

  // Auto-refresh every 10 seconds: re-fetch + merge from the shared
  // database only. Never reloads the page and never clears the user.
  // Skipped while a score sheet is open or a save is in flight so an
  // in-progress edit is not overwritten by incoming data.
  const reloadRef = React.useRef(reloadRecords);
  const lastSaveAtRef = React.useRef(0);
  const recentlyDeletedRef = React.useRef<Map<string, number>>(new Map()); // id -> timestamp, blocks re-add for 60s
  useEffect(() => { reloadRef.current = reloadRecords; });
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(async () => {
      if (selectedCell || busy) return;
      if (Date.now() - lastSaveAtRef.current < 20000) return;
      try { await reloadRef.current(); } catch { /* status already set to offline by reloadRecords */ }
    }, 10000);
    return () => clearInterval(timer);
  }, [user, selectedCell, busy]);

  // Sync-first save: Supabase FIRST, awaited. On failure show a visible
  // toast — never silently fall back. Local backup / records API run after.
  const syncSaveFirst = async (id: string, dataObj: any) => {
    if (!isSupabaseConfigured) { setSupabaseConnected(false); setSupabaseReason("no-config"); setLiveToast("Save failed to Supabase: no-config — not saved"); return { ok: false, reason: "no-config" }; }
    const res = await sbSave(id, dataObj);
    const now = new Date().toISOString();
    if (res.ok) { setSupabaseConnected(true); setSupabaseReason(""); setLastSyncAt(now); setLastUpdatedAt(now); setLiveStatus("live"); }
    else { setSupabaseConnected(false); setSupabaseReason(res.reason || "unknown"); setLiveStatus("offline"); setLiveToast(`Save failed to Supabase: ${res.reason || "unknown"} — not saved. Try again.`); }
    return res;
  };

  const activePlan = useMemo(() => {
    const forTopic = plans.filter(p => p.topic === topic);
    if (planId) { const f = forTopic.find(p => p.id === planId); if (f) return f; }
    return forTopic.find(p => p.active) || forTopic[0];
  }, [plans, topic, planId]);
  useEffect(() => { if (activePlan && planId !== activePlan.id) setPlanId(activePlan.id); }, [activePlan]);
  // Persistent tombstone filter: remove any plan whose key is in tombstones (survives logout/login)
  useEffect(() => {
    if (planTombstones.length === 0 && compPlanTombstones.length === 0) return;
    setPlans(prev => prev.filter(p => !planTombstones.includes(`${p.topic}||${p.year}`)));
    setCompPlans(prev => prev.filter(p => !compPlanTombstones.includes(`${p.category}||${p.year}`)));
  }, [planTombstones, compPlanTombstones]);
  // 3 - Entering Plans page = fresh editor: clear any previously selected procedures/feedback
  // (so an old plan's O2 therapy etc. does not stay in the form)
  const prevTabRef = (globalThis as any).__prevTabRef || ((globalThis as any).__prevTabRef = { current: "" });
  useEffect(() => {
    if (tab === "Plans" && prevTabRef.current !== "Plans") {
      setEditingCompPlanId("");
      setCompProcSearch(Array(12).fill(undefined as any)); setOpenProcIdx(null);
      setNewCompPlan(prev => ({ ...prev, procedures: Array(12).fill(null) as (string | null)[], feedback: Array(12).fill(false) as boolean[] }));
    }
    prevTabRef.current = tab;
  }, [tab]);
  const activeCompPlan = useMemo(() => {
    const forCat = compPlans.filter(p => p.category === category);
    if (compPlanId) { const f = forCat.find(p => p.id === compPlanId); if (f) return f; }
    return forCat.find(p => p.active) || forCat[0];
  }, [compPlans, category, compPlanId]);
  // YEAR-LINKED ASSIGNMENTS (defined AFTER activeCompPlan to avoid TDZ blank page)
  // If institution has year-specific assignment for active plan year, use it, else permanent.
  const effCompYear = useMemo<Record<string, { wilayat: string; institution: string }[]>>(() => {
    const yr = activeCompPlan?.year ? String(activeCompPlan.year) : undefined;
    const out: Record<string, { wilayat: string; institution: string }[]> = {};
    CATEGORIES.forEach(cat => {
      out[cat] = effInstList.filter(e => {
        if (yr) {
          const k = `${e.wilayat}||${e.institution}||${yr}`;
          if (k in yearAssignments) return yearAssignments[k].includes(cat);
        }
        return e.assignments.includes(cat);
      }).map(e => ({ wilayat: e.wilayat, institution: e.institution })).sort((a, b) => WILAYAT_ORDER.indexOf(a.wilayat) - WILAYAT_ORDER.indexOf(b.wilayat) || a.institution.localeCompare(b.institution));
    });
    return out;
  }, [effInstList, yearAssignments, activeCompPlan?.year]);
  useEffect(() => { if (activeCompPlan && compPlanId !== activeCompPlan.id) setCompPlanId(activeCompPlan.id); }, [activeCompPlan]);

  const visibleWilayats = useMemo(() => { if (!user) return []; if (user.role !== "Wilayat") return wilayatFilter === "All" ? [...WILAYAT_ORDER] : [wilayatFilter]; return [user.wilayat]; }, [user, wilayatFilter]);
  const visibleInstitutions = useMemo(() => {
    const list: { wilayat: string; institution: string }[] = [];
    visibleWilayats.forEach(w => (effPart1[w] || []).forEach(inst => {
      if (search && !(`${w} ${labelFor(w, inst)}`).toLowerCase().includes(search.toLowerCase()) && !labelFor(w, inst).toLowerCase().includes(search.toLowerCase())) return;
      list.push({ wilayat: w, institution: labelFor(w, inst) });
    }));
    return list;
  }, [visibleWilayats, search, effPart1]);
  const visibleCompInstitutions = useMemo(() => {
    const all = effCompYear[category] || []; return all.filter(v => {
      if (user?.role === "Wilayat" && user && v.wilayat !== user.wilayat) return false;
      if (user?.role !== "Wilayat" && wilayatFilter !== "All" && v.wilayat !== wilayatFilter) return false;
      if (search && !(`${v.wilayat} ${labelFor(v.wilayat, v.institution)}`).toLowerCase().includes(search.toLowerCase()) && !labelFor(v.wilayat, v.institution).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [category, user, wilayatFilter, search, effCompYear]);

  // V3: filter by topic, NOT planId — Saham and Admin can load different copies
  // of the same plan with different ids. Filtering by planId hid Saham scores from Admin.
  const planScores = useMemo(() => activePlan ? scores.filter(s => (s.topic || '') === (activePlan.topic || '') && (!s.year || !activePlan.year || s.year === activePlan.year)) : [], [scores, activePlan]);
  const findScore = (w: string, inst: string, period: string) => planScores.find(s => s.wilayat === w && s.institution === inst && s.period === period);
  // V3: same fix for Part 2 — filter by category, not planId.
  const compPlanScores = useMemo(() => activeCompPlan ? compScores.filter(s => (s.category || '') === (activeCompPlan.category || '') && (!s.year || !activeCompPlan.year || s.year === activeCompPlan.year)) : [], [compScores, activeCompPlan]);
  const findCompScore = (w: string, inst: string, period: string) => compPlanScores.find(s => s.wilayat === w && s.institution === inst && s.period === period);
  const activeBlocks = useMemo(() => getBlocks(activeCompPlan), [activeCompPlan]);
  const findBlockScore = (w: string, inst: string, block: Block): CompScore | undefined => {
    const cands = compPlanScores.filter(s => s.wilayat === w && s.institution === inst && block.months.includes(MONTH_INDEX[s.period] ?? -1) && (!s.procedure || s.procedure === block.procedure));
    if (!cands.length) return undefined;
    return [...cands].sort((a, b) => { const da = a.auditedAt ? new Date(a.auditedAt).getTime() : 0; const db = b.auditedAt ? new Date(b.auditedAt).getTime() : 0; if (db !== da) return db - da; return (MONTH_INDEX[b.period] ?? 0) - (MONTH_INDEX[a.period] ?? 0); })[0];
  };

  const manualRefresh = async () => {
    // Refresh = re-fetch + merge only. No page reload, no logout:
    // the logged-in user state is left untouched.
    if (refreshing) return;
    setRefreshing(true); setLiveStatus("refreshing");
    let ok = false;
    try { ok = await reloadRecords(); } catch { ok = false; }
    const now = new Date().toISOString();
    setRefreshing(false);
    if (ok) {
      setLastUpdatedAt(now); setLiveStatus("live");
      setLiveToast(`Live • Updated ${formatLiveTime(now)}`);
    } else {
      setLiveStatus("offline");
      setLiveToast("Local only — shared database could not be reached. Your login is kept; try Refresh again.");
    }
    setTimeout(() => setLiveToast(null), 4000);
  };

  async function login(e: React.FormEvent) {
    e.preventDefault(); setLoginError("");
    const uname = username.trim().toLowerCase(); const entered = password;
    const defaultUser = DEFAULT_USERS.find(u => u.username === uname);
    const override = overrides.find(o => o.username === uname);
    const effective = effectiveUsers.find(u => u.username === uname) || defaultUser;
    const defaultMatches = !!defaultUser && defaultUser.password === entered;
    const overrideMatches = !!override && override.password === entered;
    const passwordOk = override ? overrideMatches : defaultMatches;
    const matchedUser = passwordOk ? (override ? effective : defaultUser) : undefined;
    if (!matchedUser || !passwordOk) { setLoginError("Incorrect username or password."); return; }
    if (security.disabled.includes(matchedUser.username)) { setLoginError("This account has been disabled by Admin."); return; }
    if (security.locked && matchedUser.role !== "Master") { setLoginError("System locked by Master."); return; }
    if (security.accessCodeEnabled && accessCodeInput.trim() !== security.accessCode) { setLoginError("Incorrect Directorate Access Code."); return; }
    setUser(matchedUser); setUserSessionVersion(security.sessionVersion); setTab("Dashboard"); setAccessCodeInput(""); setRecoveryInput(""); setLoginError("");
    // Persist only username + sessionVersion on THIS device (never password, never Supabase).
    try { localStorage.setItem('audit_current_user', JSON.stringify({ username: matchedUser.username, sessionVersion: security.sessionVersion })); } catch {}
    await reloadRecords();
  }
  async function logout() { setUser(null); setPassword(""); setSelectedCell(null); setUserSessionVersion(null); try { localStorage.removeItem('audit_current_user'); } catch {} }

  const isScoreValid = (v: string) => { const t = v.trim().toUpperCase(); if (t === "") return false; if (t === "NA") return true; const n = Number(t); return !isNaN(n) && n >= 0 && n <= 100; };
  const isNameValid = (v: string) => v.trim().length >= 2;

  async function saveCell() {
    if (!selectedCell || !user) return;
    const val = scoreInput.trim().toUpperCase();
    const nameVal = auditorNameInput.trim();
    if (!isScoreValid(scoreInput)) { setLiveToast("Score is mandatory: enter 0–100 or NA."); return; }
    if (!isNameValid(auditorNameInput)) { setLiveToast("Auditor Name is mandatory: enter at least 2 characters."); return; }
    setBusy(true); setSaveMsg(""); lastSaveAtRef.current = Date.now();
    const nowIso = new Date().toISOString();
    if (selectedCell.part === "2") {
      if (!activeCompPlan) { setBusy(false); return; }
      const idx = activeCompPlan.periods.indexOf(selectedCell.period);
      if (idx >= 0 && activeCompPlan.feedback?.[idx]) { setLiveToast("This month is Obtaining Feedback — it cannot receive a score."); setBusy(false); return; }
      const proc = (idx >= 0 ? activeCompPlan.procedures?.[idx] : null) || "";
      const existing = findCompScore(selectedCell.wilayat, selectedCell.institution, selectedCell.period);
      const value = { planId: activeCompPlan.id, wilayat: selectedCell.wilayat, institution: cleanInstitutionName(selectedCell.institution, selectedCell.wilayat), category: selectedCell.category || category, year: activeCompPlan.year, period: selectedCell.period, procedure: proc, score: val, comment: commentInput.trim(), auditorName: nameVal, auditedAt: nowIso, history: existing?.history || [] };
      const newId = existing ? existing.id : `comp-score-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newRec: CompScore = { id: newId, ...value } as CompScore;
      setCompScores(prev => { const filtered = prev.filter(s => !(s.wilayat === selectedCell.wilayat && s.institution === selectedCell.institution && s.period === selectedCell.period && s.planId === activeCompPlan.id)); return [...filtered, newRec]; });
      const supId = `competency_scores_${newId}`;
      await syncSaveFirst(supId, { id: newId, ...value });
      try { if (existing) await api("records.replace", { collection: "competency_scores", id: existing.id, value }); else await api("records.create", { collection: "competency_scores", value, idempotency_key: `compscore-${activeCompPlan.id}-${selectedCell.wilayat}-${selectedCell.institution}-${selectedCell.period}-${Date.now()}` }); } catch {}
      saveLocalBackup({ plans, scores, compPlans, compScores: [...compScores.filter(s => !(s.wilayat === selectedCell.wilayat && s.institution === selectedCell.institution && s.period === selectedCell.period && s.planId === activeCompPlan.id)), newRec], instOverrides, procOverrides, overrides, auditorProfiles, security });
      setSaveMsg(""); setSelectedCell(null); setBusy(false);
      setLastUpdatedAt(nowIso); setLiveStatus("live");
      return;
    }
    if (!activePlan) { setBusy(false); return; }
    const existing = findScore(selectedCell.wilayat, selectedCell.institution, selectedCell.period);
    const value = { planId: activePlan.id, wilayat: selectedCell.wilayat, institution: cleanInstitutionName(selectedCell.institution, selectedCell.wilayat), topic: activePlan.topic, year: activePlan.year, period: selectedCell.period, score: val, comment: commentInput.trim(), auditorName: nameVal, auditedAt: nowIso, history: existing?.history || [] };
    const newId = existing ? existing.id : `score-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newRec: Score = { id: newId, ...value } as Score;
    setScores(prev => { const filtered = prev.filter(s => !(s.wilayat === selectedCell.wilayat && s.institution === selectedCell.institution && s.period === selectedCell.period && s.planId === activePlan.id)); return [...filtered, newRec]; });
    const supId = `audit_scores_${newId}`;
    await syncSaveFirst(supId, { id: newId, ...value });
    try { if (existing) await api("records.replace", { collection: "audit_scores", id: existing.id, value }); else await api("records.create", { collection: "audit_scores", value, idempotency_key: `score-${activePlan.id}-${selectedCell.wilayat}-${selectedCell.institution}-${selectedCell.period}-${Date.now()}` }); } catch {}
    saveLocalBackup({ plans, scores: [...scores.filter(s => !(s.wilayat === selectedCell.wilayat && s.institution === selectedCell.institution && s.period === selectedCell.period && s.planId === activePlan.id)), newRec], compPlans, compScores, instOverrides, procOverrides, overrides, auditorProfiles, security });
    setSaveMsg(""); setSelectedCell(null); setBusy(false); setLastUpdatedAt(nowIso); setLiveStatus("live");
  }

  async function deleteScore() {
    if (!selectedCell) return;
    setBusy(true);
    if (selectedCell.part === "2") {
      const ex = findCompScore(selectedCell.wilayat, selectedCell.institution, selectedCell.period); if (!ex) { setBusy(false); return; }
      setCompScores(prev => prev.filter(s => s.id !== ex.id));
      await supabaseDelete(`competency_scores_${ex.id}`);
      try { await api("records.delete", { collection: "competency_scores", id: ex.id }); } catch {}
    } else {
      const ex = findScore(selectedCell.wilayat, selectedCell.institution, selectedCell.period); if (!ex) { setBusy(false); return; }
      setScores(prev => prev.filter(s => s.id !== ex.id));
      await supabaseDelete(`audit_scores_${ex.id}`);
      try { await api("records.delete", { collection: "audit_scores", id: ex.id }); } catch {}
    }
    setSelectedCell(null); setLiveToast("Entry removed."); setBusy(false);
  }

  function openCell(v: { wilayat: string; institution: string }, period: string, partOverride?: string, catOverride?: string) {
    if (!user) return;
    // 9 - Deactivated plan: Wilayat can view but cannot edit. Admin/Master can still edit.
    if (user.role === "Wilayat") {
      if (partOverride === "2" && activeCompPlan && !activeCompPlan.active) { setLiveToast("This Competency plan is deactivated — view only. Ask Admin to activate it to edit."); return; }
      if (partOverride !== "2" && activePlan && !activePlan.active) { setLiveToast("This Part 1 plan is deactivated — view only. Ask Admin to activate it to edit."); return; }
    }
    if (partOverride === "2") {
      const _fIdx = MONTHS.indexOf(period);
      if (_fIdx >= 0 && activeCompPlan?.feedback?.[_fIdx]) { setLiveToast("This month is Obtaining Feedback — it cannot receive a score."); return; }
      const ex = findCompScore(v.wilayat, v.institution, period);
      setSelectedCell({ wilayat: v.wilayat, institution: v.institution, period, part: "2", category: catOverride || category });
      setScoreInput(ex ? ex.score : ""); setCommentInput(ex ? ex.comment : ""); setAuditorNameInput(ex?.auditorName || auditorProfiles.find(p => p.username === user.username)?.lastName || ""); setSaveMsg(""); return;
    }
    const ex = findScore(v.wilayat, v.institution, period);
    setSelectedCell({ wilayat: v.wilayat, institution: v.institution, period, part: "1" });
    setScoreInput(ex ? ex.score : ""); setCommentInput(ex ? ex.comment : ""); setAuditorNameInput(ex?.auditorName || auditorProfiles.find(p => p.username === user.username)?.lastName || ""); setSaveMsg("");
  }

  const isMaster = user?.role === "Master";
  const isAdminRole = user?.role === "Admin";
  const isAdmin = isMaster || isAdminRole;
  const headerRoleText = isMaster ? "Master" : isAdminRole ? "Admin — Nursing Service Department" : `${user?.label} — Wilayat`;
  const tabs = ["Dashboard", "Audit Grid", "Comments", "Guide", ...(isAdmin ? ["Plans", "Control Panel"] : [])];

  function statsFor(list: Score[]) { const nums = list.filter(s => s.score !== "NA" && s.score !== "").map(s => parseFloat(s.score)).filter(n => !isNaN(n)); return { count: list.length, avg: nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null }; }
  function statsForComp(list: CompScore[]) { const nums = list.filter(s => s.score !== "NA" && s.score !== "").map(s => parseFloat(s.score)).filter(n => !isNaN(n)); return { count: list.length, avg: nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null }; }
  const gridStats = useMemo(() => {
    const relevant = planScores.filter(s => visibleInstitutions.some(v => v.wilayat === s.wilayat && v.institution === s.institution));
    const totalExpected = activePlan ? visibleInstitutions.length * activePlan.periods.length : 0;
    const st = statsFor(relevant);
    return { ...st, totalExpected, missing: Math.max(0, totalExpected - relevant.length), completion: totalExpected ? (relevant.length / totalExpected * 100) : 0 };
  }, [planScores, visibleInstitutions, activePlan]);
  const compGridStats = useMemo(() => {
    if (!activeCompPlan) return { count: 0, avg: null as number | null, totalExpected: 0, missing: 0, completion: 0 };
    let count = 0; const allBlockScores: CompScore[] = [];
    visibleCompInstitutions.forEach(v => { activeBlocks.forEach(b => { const s = findBlockScore(v.wilayat, v.institution, b); if (s) { count++; allBlockScores.push(s); } }); });
    const totalExpected = visibleCompInstitutions.length * activeBlocks.length;
    const st = statsForComp(allBlockScores);
    return { count, avg: st.avg, totalExpected, missing: Math.max(0, totalExpected - count), completion: totalExpected ? (count / totalExpected * 100) : 0 };
  }, [compPlanScores, visibleCompInstitutions, activeCompPlan, activeBlocks]);

  const dbLabel = isSupabaseConfigured && supabaseConnected ? `Live • Supabase • Connected • Updated ${formatLiveTime(lastUpdatedAt)}` : isSupabaseConfigured ? `Local only • Supabase not connected: ${supabaseReason || "unknown"}` : `Local mode • Updated ${formatLiveTime(lastUpdatedAt)}`;

  function exportCSV() {
    if (part === "2") {
      if (!activeCompPlan) return;
      const simpleHeader = ["Wilayat", "Institution", "Category", "Number of Audits", ...activeCompPlan.periods.map((p, i) => `${p} | ${activeCompPlan.feedback?.[i] ? "Obtaining Feedback" : `Procedure: ${displayProcedure(activeCompPlan.procedures?.[i])}`} | Score`), ...activeCompPlan.periods.map((p, i) => `${p} | Comment`), ...activeCompPlan.periods.map((p, i) => `${p} | Audited by`), ...activeCompPlan.periods.map((p, i) => `${p} | Added at Muscat`), ...activeCompPlan.periods.map((p, i) => `${p} | Added at ISO`)];
      const simple: string[][] = [simpleHeader];
      visibleCompInstitutions.forEach(v => {
        const blockMap = new Map<string, CompScore>();
        activeBlocks.forEach(b => { const s = findBlockScore(v.wilayat, v.institution, b); if (s) blockMap.set(`${b.start}-${b.end}`, s); });
        const count = blockMap.size;
        const scoreCells = activeCompPlan.periods.map((p, i) => {
          if (activeCompPlan.feedback?.[i]) return "Feedback"; if (!activeCompPlan.procedures?.[i]) return "";
          const block = blockForMonth(activeCompPlan, i); if (!block) return ""; const bs = blockMap.get(`${block.start}-${block.end}`); if (!bs) return ""; if (bs.period === p) return bs.score; return `Covered — score in ${bs.period}`;
        });
        const commentCells = activeCompPlan.periods.map((p, i) => { if (activeCompPlan.feedback?.[i]) return "Feedback"; const block = blockForMonth(activeCompPlan, i); if (!block) return ""; const bs = blockMap.get(`${block.start}-${block.end}`); if (!bs) return ""; return bs.period === p ? (bs.comment || "") : ""; });
        const auditorCells = activeCompPlan.periods.map((p, i) => { if (activeCompPlan.feedback?.[i]) return ""; const block = blockForMonth(activeCompPlan, i); if (!block) return ""; const bs = blockMap.get(`${block.start}-${block.end}`); if (!bs) return ""; return bs.period === p ? (bs.auditorName || "") : ""; });
        const muscatCells = activeCompPlan.periods.map((p, i) => { if (activeCompPlan.feedback?.[i]) return ""; const block = blockForMonth(activeCompPlan, i); if (!block) return ""; const bs = blockMap.get(`${block.start}-${block.end}`); if (!bs) return ""; return bs.period === p ? (bs.auditedAt ? formatMuscat(bs.auditedAt) : "") : ""; });
        const isoCells = activeCompPlan.periods.map((p, i) => { if (activeCompPlan.feedback?.[i]) return ""; const block = blockForMonth(activeCompPlan, i); if (!block) return ""; const bs = blockMap.get(`${block.start}-${block.end}`); if (!bs) return ""; return bs.period === p ? (bs.auditedAt || "") : ""; });
        simple.push([v.wilayat, labelFor(v.wilayat, v.institution), category, String(count), ...scoreCells, ...commentCells, ...auditorCells, ...muscatCells, ...isoCells]);
      });
      const csv = simple.map(r => r.map(c => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.style.display = "none"; a.href = url; a.download = `competency-${activeCompPlan.category}-${activeCompPlan.year}.csv`; document.body.appendChild(a); a.click(); setTimeout(() => { try { document.body.removeChild(a); } catch {} URL.revokeObjectURL(url); }, 2000); return;
    }
    if (!activePlan) return;
    const rowsHeader = ["Wilayat", "Institution", "Number of Audits", "Average (%)", ...activePlan.periods.map(p => `${p} Score`), ...activePlan.periods.map(p => `${p} Comment`), ...activePlan.periods.map(p => `${p} Audited by`), ...activePlan.periods.map(p => `${p} Added at Muscat DD-MM-YYYY HH:mm`), ...activePlan.periods.map(p => `${p} Added at ISO`)];
    const rows: string[][] = [rowsHeader];
    visibleInstitutions.forEach(v => {
      const cells = activePlan.periods.map(p => findScore(v.wilayat, v.institution, p));
      const nums = cells.filter(c => c && c.score !== "NA").map(c => parseFloat(c!.score)).filter(n => !isNaN(n));
      rows.push([v.wilayat, labelFor(v.wilayat, v.institution), String(cells.filter(Boolean).length), nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : "", ...cells.map(c => c ? c.score : ""), ...cells.map(c => c ? c.comment : ""), ...cells.map(c => c?.auditorName || ""), ...cells.map(c => c?.auditedAt ? formatMuscat(c.auditedAt) : ""), ...cells.map(c => c?.auditedAt || ""),]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.style.display = "none"; a.href = url; a.download = `audit-${activePlan.topic}-${activePlan.year}.csv`; document.body.appendChild(a); a.click(); setTimeout(() => { try { document.body.removeChild(a); } catch {} URL.revokeObjectURL(url); }, 2000);
  }

  function exportPart1StatsExcel() {
    const nowIso = new Date().toISOString(); const nowMuscat = formatMuscat(nowIso);
    const filteredScores = scores.filter(s => {
      if (user?.role === "Wilayat" && s.wilayat !== user.wilayat) return false;
      if (isAdmin && wilayatFilter !== "All" && s.wilayat !== wilayatFilter) return false;
      if (search && !(`${s.wilayat} ${labelFor(s.wilayat, s.institution)}`.toLowerCase().includes(search.toLowerCase()))) return false;
      if (activePlan) { return s.planId === activePlan.id; }
      return s.topic === topic;
    });
    const detailedHeader = ["Wilayat", "Institution", "Topic", "Year", "Month", "Score", "Audited by", "Added at (Asia/Muscat)", "Comment", "Status"];
    const detailedRows: string[][] = [["Part 1 Statistics", `Topic=${topic} | Year=${activePlan?.year || "All"} | Wilayat=${wilayatFilter} | Generated ${nowMuscat}`], [""], detailedHeader];
    const sorted = [...filteredScores].sort((a, b) => { const wi = WILAYAT_ORDER.indexOf(a.wilayat) - WILAYAT_ORDER.indexOf(b.wilayat); if (wi !== 0) return wi; const ii = a.institution.localeCompare(b.institution); if (ii !== 0) return ii; return (MONTH_INDEX[a.period] ?? 0) - (MONTH_INDEX[b.period] ?? 0); });
    sorted.forEach(s => { const status = s.score === "NA" ? "NA" : s.score ? "Submitted" : "Missing"; detailedRows.push([s.wilayat, labelFor(s.wilayat, s.institution), s.topic, String(s.year), s.period, s.score, s.auditorName || "", s.auditedAt ? formatMuscat(s.auditedAt) : "", s.comment || "", status]); });
    if (detailedRows.length === 3) { detailedRows.push(["No data for current filters", "", "", "", "", "", "", "", "", ""]); }
    const summaryHeader = ["Wilayat", "Institutions count", "Audits count", "Average", "Completion %"];
    const summaryRows: string[][] = [["Summary by Wilayat - Part 1", `Generated ${nowMuscat}`], [""], summaryHeader];
    const wilayatsForSummary = user?.role === "Wilayat" ? [user.wilayat] : (wilayatFilter === "All" ? [...WILAYAT_ORDER] : [wilayatFilter]);
    wilayatsForSummary.forEach(w => {
      const instCount = (effPart1[w] || []).filter(inst => { if (search && !(`${w} ${labelFor(w, inst)}`.toLowerCase().includes(search.toLowerCase()))) return false; return true; }).length;
      const rel = filteredScores.filter(s => s.wilayat === w);
      const nums = rel.filter(s => s.score !== "NA" && s.score !== "").map(s => parseFloat(s.score)).filter(n => !isNaN(n));
      const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : "";
      const expected = instCount * 12;
      const completion = expected ? ((rel.length / expected) * 100).toFixed(1) : "0";
      summaryRows.push([w, String(instCount), String(rel.length), avg, completion]);
    });
    downloadXLSX(`Part1_Stats_${activePlan?.year || "All"}_${topic}_${Date.now()}.xlsx`, [{ name: "Detailed Scores", rows: detailedRows }, { name: "Summary by Wilayat", rows: summaryRows }]);
  }

  function exportPart2StatsExcel() {
    const nowMuscat = formatMuscat(new Date().toISOString());
    const blocks = activeCompPlan ? getBlocks(activeCompPlan) : [];
    const detailedHeader = ["Category", "Wilayat", "Institution", "Procedure", "Year", "Block", "Month", "Score", "Audited by", "Added at (Asia/Muscat)", "Status"];
    const detailedRows: string[][] = [["Part 2 Statistics", `Category=${category} | Year=${activeCompPlan?.year || "All"} | Generated ${nowMuscat}`], [""], detailedHeader];
    if (activeCompPlan) {
      const sortedInst = [...visibleCompInstitutions].sort((a, b) => WILAYAT_ORDER.indexOf(a.wilayat) - WILAYAT_ORDER.indexOf(b.wilayat) || a.institution.localeCompare(b.institution));
      sortedInst.forEach(v => {
        blocks.forEach(b => {
          const s = findBlockScore(v.wilayat, v.institution, b);
          if (s) { detailedRows.push([category, v.wilayat, labelFor(v.wilayat, v.institution), b.procedure, String(activeCompPlan.year), blockLabel(b), s.period, s.score, s.auditorName || "", s.auditedAt ? formatMuscat(s.auditedAt) : "", "Submitted"]); }
          else { detailedRows.push([category, v.wilayat, labelFor(v.wilayat, v.institution), b.procedure, String(activeCompPlan.year), blockLabel(b), MONTHS[b.start], "", "", "", "Missing"]); }
        });
      });
    }
    const summaryHeader = ["Category", "Wilayat", "Institutions count", "Audits (blocks)", "Expected blocks", "Completion %", "Average"];
    const summaryRows: string[][] = [["Summary by Category/Wilayat - Part 2", `Generated ${nowMuscat}`], [""], summaryHeader];
    const wilayatsForSummary = user?.role === "Wilayat" ? [user.wilayat] : (wilayatFilter === "All" ? [...WILAYAT_ORDER] : [wilayatFilter]);
    wilayatsForSummary.forEach(w => {
      const insts = (effCompYear[category] || []).filter(v => v.wilayat === w && (!search || `${v.wilayat} ${labelFor(v.wilayat, v.institution)}`.toLowerCase().includes(search.toLowerCase())));
      const instCount = insts.length; const expected = activeCompPlan ? instCount * blocks.length : instCount;
      let audits = 0; const nums: number[] = [];
      insts.forEach(v => { if (activeCompPlan) { blocks.forEach(b => { const s = findBlockScore(v.wilayat, v.institution, b); if (s) { audits++; if (s.score !== "NA") { const n = parseFloat(s.score); if (!isNaN(n)) nums.push(n); } } }); } });
      const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : ""; const completion = expected ? ((audits / expected) * 100).toFixed(1) : "0";
      summaryRows.push([category, w, String(instCount), String(audits), String(expected), completion, avg]);
    });
    downloadXLSX(`Part2_Stats_${activeCompPlan?.year || "All"}_${category}_${Date.now()}.xlsx`, [{ name: "Detailed Scores", rows: detailedRows }, { name: "Summary by Category", rows: summaryRows }]);
  }

  // 9 - Master/Admin can activate / deactivate plans. Deactivated = Wilayat sees scores but cannot edit.
  async function deletePart1Plan(plan: Plan) {
    if (!window.confirm(`Delete Part 1 plan ${plan.topic} · ${plan.year}? Its scores will also be deleted.`)) return;
    lastSaveAtRef.current = Date.now();
    const delKey = `${plan.topic}||${plan.year}`;
    // Persistent tombstone - survives logout/login
    setPlanTombstones(prev => {
      if (prev.includes(delKey)) return prev;
      const next = [...prev, delKey];
      try { localStorage.setItem('audit_tombstones_plans', JSON.stringify(next)); } catch {}
      return next;
    });
    recentlyDeletedRef.current.set(plan.id, Date.now());
    recentlyDeletedRef.current.set(delKey, Date.now());
    // Remove from local state immediately (all matching keys, not just id)
    setPlans(prev => prev.filter(x => `${x.topic}||${x.year}` !== delKey));
    setScores(prev => prev.filter(s => !(s.topic === plan.topic && s.year === plan.year) && s.planId !== plan.id));
    // Save tombstone to Supabase so other devices and future logins respect it
    try {
      const tombId = `audit_tombstones_plan_${plan.topic.replace(/\s+/g,'_')}_${plan.year}`;
      await sbSave(tombId, { kind: "plan", key: delKey, topic: plan.topic, year: plan.year, deletedAt: new Date().toISOString() });
    } catch {}
    // Delete ALL matching plan rows from Supabase (covers duplicates with different ids)
    try {
      const all = await sbLoadAll();
      if (all.ok) {
        for (const r of all.rows) {
          const id = r.id || ""; const d = r.data || {};
          if (id.startsWith("audit_plans_") && d.topic === plan.topic && d.year === plan.year) {
            try { await supabaseDelete(id); } catch {}
          }
          if (id.startsWith("audit_scores_") && d.topic === plan.topic && d.year === plan.year) {
            try { await supabaseDelete(id); } catch {}
          }
        }
      }
    } catch {}
    try { await supabaseDelete(`audit_plans_${plan.id}`); } catch {}
    try { await api("records.delete", { collection: "audit_plans", id: plan.id }); } catch {}
    const stale = scores.filter(s => s.planId === plan.id || (s.topic === plan.topic && s.year === plan.year));
    for (const s of stale) { try { await supabaseDelete(`audit_scores_${s.id}`); } catch {} try { await api("records.delete", { collection: "audit_scores", id: s.id }); } catch {} }
    setLiveToast(`Part 1 plan ${plan.topic} · ${plan.year} deleted.`);
  }
  async function deleteCompPlan(plan: CompPlan) {
    if (!window.confirm(`Delete Part 2 plan ${plan.category} · ${plan.year}? Its scores will also be deleted.`)) return;
    lastSaveAtRef.current = Date.now();
    const delKey = `${plan.category}||${plan.year}`;
    setCompPlanTombstones(prev => {
      if (prev.includes(delKey)) return prev;
      const next = [...prev, delKey];
      try { localStorage.setItem('audit_tombstones_compPlans', JSON.stringify(next)); } catch {}
      return next;
    });
    recentlyDeletedRef.current.set(plan.id, Date.now());
    recentlyDeletedRef.current.set(delKey, Date.now());
    setCompPlans(prev => prev.filter(x => `${x.category}||${x.year}` !== delKey));
    setCompScores(prev => prev.filter(s => !(s.category === plan.category && s.year === plan.year) && s.planId !== plan.id));
    try {
      const tombId = `audit_tombstones_compPlan_${plan.category.replace(/\s+/g,'_')}_${plan.year}`;
      await sbSave(tombId, { kind: "compPlan", key: delKey, category: plan.category, year: plan.year, deletedAt: new Date().toISOString() });
    } catch {}
    try {
      const all = await sbLoadAll();
      if (all.ok) {
        for (const r of all.rows) {
          const id = r.id || ""; const d = r.data || {};
          if ((id.startsWith("competency_plans_") || id.startsWith("audit_plans_")) && d.category === plan.category && d.year === plan.year) {
            try { await supabaseDelete(id); } catch {}
          }
          if (id.startsWith("competency_scores_") && d.category === plan.category && d.year === plan.year) {
            try { await supabaseDelete(id); } catch {}
          }
        }
      }
    } catch {}
    try { await supabaseDelete(`competency_plans_${plan.id}`); } catch {}
    try { await api("records.delete", { collection: "competency_plans", id: plan.id }); } catch {}
    const stale = compScores.filter(s => s.planId === plan.id || (s.category === plan.category && s.year === plan.year));
    for (const s of stale) { try { await supabaseDelete(`competency_scores_${s.id}`); } catch {} try { await api("records.delete", { collection: "competency_scores", id: s.id }); } catch {} }
    if (editingCompPlanId === plan.id) { setEditingCompPlanId(null); setCompProcSearch(Array(12).fill(undefined as any)); setOpenProcIdx(null); }
    setLiveToast(`Part 2 plan ${plan.category} · ${plan.year} deleted.`);
  }
  async function restoreAllDeletedPlans() {
    if (!window.confirm(`Restore all deleted plans? This will clear tombstones and bring back default plans on next refresh.`)) return;
    lastSaveAtRef.current = Date.now();
    // Clear local state
    setPlanTombstones([]);
    setCompPlanTombstones([]);
    try { localStorage.removeItem('audit_tombstones_plans'); } catch {}
    try { localStorage.removeItem('audit_tombstones_compPlans'); } catch {}
    // Delete tombstone rows from Supabase
    try {
      const all = await sbLoadAll();
      if (all.ok) {
        for (const r of all.rows) {
          if ((r.id || "").startsWith("audit_tombstones_")) {
            try { await supabaseDelete(r.id); } catch {}
          }
        }
      }
    } catch {}
    // Restore defaults immediately
    setPlans(DEFAULT_PLANS);
    setCompPlans(DEFAULT_COMP_PLANS);
    setLiveToast(`Deleted plans restored — defaults back. Refresh to reload from Supabase.`);
  }
  async function togglePart1PlanActive(plan: Plan) {
    const next = !plan.active;
    lastSaveAtRef.current = Date.now();
    setPlans(prev => prev.map(x => x.id === plan.id ? { ...x, active: next } : x));
    try { await syncSaveFirst(`audit_plans_${plan.id}`, { id: plan.id, topic: plan.topic, year: plan.year, frequency: plan.frequency, periods: plan.periods, active: next }); } catch {}
    setLiveToast(next ? `${plan.topic} · ${plan.year} activated.` : `${plan.topic} · ${plan.year} deactivated — Wilayat view only.`);
  }
  async function toggleCompPlanActive(plan: CompPlan) {
    const next = !plan.active;
    lastSaveAtRef.current = Date.now();
    setCompPlans(prev => prev.map(x => x.id === plan.id ? { ...x, active: next } : x));
    try { await syncSaveFirst(`competency_plans_${plan.id}`, { id: plan.id, category: plan.category, year: plan.year, frequency: plan.frequency, periods: plan.periods, procedures: plan.procedures, feedback: plan.feedback, active: next }); } catch {}
    setLiveToast(next ? `${plan.category} · ${plan.year} activated.` : `${plan.category} · ${plan.year} deactivated — Wilayat view only.`);
  }
  // 5 - Export Competency plan to Word (.doc) — last accepted format:
  // A4 landscape matrix (Serial / Planned Procedures / Jan-Dec) with MOH logo centred,
  // green #c9ead9 highlight in the months where the procedure is planned.
  async function exportCompPlanWord() {
    if (!activeCompPlan) return;
    const seen: string[] = []; const rowMonths: number[][] = [];
    activeCompPlan.periods.forEach((_, i) => {
      if (activeCompPlan.feedback?.[i]) return; const proc = activeCompPlan.procedures?.[i]; if (!proc) return;
      const k = seen.indexOf(proc); if (k === -1) { seen.push(proc); rowMonths.push([i]); } else rowMonths[k].push(i);
    });
    const fbMonths: number[] = []; const skipMonths: number[] = [];
    activeCompPlan.periods.forEach((_, i) => { if (activeCompPlan.feedback?.[i]) fbMonths.push(i); else if (!activeCompPlan.procedures?.[i]) skipMonths.push(i); });
    if (fbMonths.length) { seen.push("Obtaining Feedback"); rowMonths.push(fbMonths); }
    if (skipMonths.length) { seen.push("— Skipped —"); rowMonths.push(skipMonths); }

    // HTML version for desktop (old working version with logo)
    const rowsHtml = seen.map((proc, r) => {
      const isFbRow = proc === "Obtaining Feedback";
      const isSkipRow = proc === "— Skipped —";
      const procCell = (isFbRow || isSkipRow) ? "" : xmlEscape(displayProcedure(proc) || proc);
      const monthCells = activeCompPlan.periods.map((_, i) => rowMonths[r].includes(i) ? `<td style="background:#c9ead9;">${isFbRow ? "Obtaining feedback" : isSkipRow ? "Skipped" : "&nbsp;"}</td>` : `<td>&nbsp;</td>`).join("");
      return `<tr><td style="text-align:center;">${r + 1}</td><td style="text-align:left;">${procCell}</td>${monthCells}</tr>`;
    }).join("");
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${xmlEscape(activeCompPlan.category)} Competency Procedures plan ${activeCompPlan.year}</title><style>@page WordSection1{size:29.7cm 21cm;mso-page-orientation:landscape;margin:1cm 1cm 1cm 1cm;} div.WordSection1{page:WordSection1;} body{font-family:Calibri,Arial,sans-serif;font-size:10pt;color:#102a2c;} p{margin:4pt 0;} table{border-collapse:collapse;width:100%;font-size:9pt;} th,td{border:1pt solid #7a8a88;padding:4pt 5pt;text-align:center;vertical-align:middle;} th{background:#0d6e6b;color:#ffffff;font-weight:bold;} thead{display:table-header-group;} tr{page-break-inside:avoid;}</style></head><body><div class="WordSection1"><div style="text-align:center;"><p style="text-align:center;margin:0 0 6pt;"><img src="${MOH_LOGO_DATA_URL}" alt="Ministry of Health logo" style="height:72px;width:auto;" /></p><p style="font-size:13pt;font-weight:bold;margin:2pt 0;">Directorate General of Health Services - NBG</p><p style="font-size:13pt;font-weight:bold;margin:2pt 0;">Nursing Service Department</p><p style="font-size:15pt;font-weight:bold;margin:4pt 0 10pt;">${xmlEscape(activeCompPlan.category)} Competency Procedures plan ${activeCompPlan.year}</p></div><table><thead><tr><th style="width:5%;">Serial Number</th><th style="width:22%;text-align:left;">Planned Procedures</th>${activeCompPlan.periods.map(m => `<th style="width:6.5%;">${m}</th>`).join("")}</tr></thead><tbody>${rowsHtml}</tbody></table></div></body></html>`;

    const fileNameDoc = `${activeCompPlan.category.replace(/\s+/g, "_")}_Competency_Procedures_plan_${activeCompPlan.year}.doc`;
    const fileNameDocx = `${activeCompPlan.category.replace(/\s+/g, "_")}_Competency_Procedures_plan_${activeCompPlan.year}.docx`;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);

    if (isIOS) {
      try {
        const zipBytes = buildDocxBytes(activeCompPlan.category, activeCompPlan.year, seen, rowMonths, activeCompPlan.periods, MOH_LOGO_DATA_URL);
        const zipCopy: Uint8Array<ArrayBuffer> = new Uint8Array(zipBytes);
        const blobDocx = new Blob([zipCopy.buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const fileDocx = new File([blobDocx], fileNameDocx, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const nav: any = navigator as any;
        if (nav.canShare && nav.canShare({ files: [fileDocx] }) && nav.share) {
          await nav.share({ files: [fileDocx], title: fileNameDocx, text: fileNameDocx });
          return;
        }
        const urlDocx = URL.createObjectURL(blobDocx);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = urlDocx;
        (a as any).download = fileNameDocx;
        a.setAttribute("download", fileNameDocx);
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { try { document.body.removeChild(a); } catch {} URL.revokeObjectURL(urlDocx); }, 6000);
        return;
      } catch (e) {
        console.log("iOS docx failed, fallback to html view", e);
        try {
          const viewBlob = new Blob(["\ufeff" + html], { type: "text/html;charset=utf-8" });
          const viewUrl = URL.createObjectURL(viewBlob);
          window.open(viewUrl, "_blank");
          setTimeout(() => URL.revokeObjectURL(viewUrl), 8000);
          return;
        } catch {}
      }
    }

    // Desktop — restore old working .doc with logo (you said "at least desktop version like before")
    try {
      const blob = new Blob(["\ufeff" + html], { type: "application/msword;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      (a as any).download = fileNameDoc;
      a.setAttribute("download", fileNameDoc);
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { try { document.body.removeChild(a); } catch {} URL.revokeObjectURL(url); }, 2500);
    } catch (e: any) {
      console.log("desktop doc build failed", e);
      alert("Could not build Word file: " + (e?.message || e));
    }
  }
  async function createPlan(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const value = { topic: newPlan.topic, year: newPlan.year, frequency: "Monthly", periods: [...MONTHS], active: true };
      const newId = `plan-${Date.now()}`;
      const newP: Plan = { id: newId, ...value };
      const key = `${value.topic}||${value.year}`;
      // If this key was previously deleted, clear its tombstone so it doesn't re-delete on refresh
      setPlanTombstones(prev => {
        if (!prev.includes(key)) return prev;
        const next = prev.filter(k => k !== key);
        try { localStorage.setItem('audit_tombstones_plans', JSON.stringify(next)); } catch {}
        return next;
      });
      recentlyDeletedRef.current.delete(newId);
      recentlyDeletedRef.current.delete(key);
      try {
        const tombId = `audit_tombstones_plan_${value.topic.replace(/\s+/g,'_')}_${value.year}`;
        await supabaseDelete(tombId);
      } catch {}
      setPlans(prev => [...prev.filter(p => !(p.topic === value.topic && p.year === value.year)), newP]);
      lastSaveAtRef.current = Date.now();
      await syncSaveFirst(`audit_plans_${newId}`, { id: newId, ...value });
      try { await api("records.create", { collection: "audit_plans", value, idempotency_key: `plan-${newPlan.topic}-${newPlan.year}-${Date.now()}` }); } catch {}
      setLiveToast("Plan created and set as active."); setTopic(newPlan.topic);
    } catch (err: any) { setSaveMsg(`Could not create plan: ${err.message}`); }
    setBusy(false);
  }
  async function createCompPlan(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const value = { category: newCompPlan.category, year: newCompPlan.year, frequency: "Monthly", periods: [...MONTHS], procedures: newCompPlan.procedures, feedback: newCompPlan.feedback, active: true };
      const editing = !!editingCompPlanId;
      const newId = editing ? editingCompPlanId : `compplan-${Date.now()}`;
      const newP: CompPlan = { id: newId, ...value };
      const key = `${value.category}||${value.year}`;
      if (!editing) {
        setCompPlanTombstones(prev => {
          if (!prev.includes(key)) return prev;
          const next = prev.filter(k => k !== key);
          try { localStorage.setItem('audit_tombstones_compPlans', JSON.stringify(next)); } catch {}
          return next;
        });
        recentlyDeletedRef.current.delete(newId);
        recentlyDeletedRef.current.delete(key);
        try {
          const tombId = `audit_tombstones_compPlan_${value.category.replace(/\s+/g,'_')}_${value.year}`;
          await supabaseDelete(tombId);
        } catch {}
      }
      if (editing) setCompPlans(prev => prev.map(p => p.id === newId ? newP : p));
      else setCompPlans(prev => [...prev.filter(p => !(p.category === value.category && p.year === value.year)), newP]);
      lastSaveAtRef.current = Date.now();
      await syncSaveFirst(`competency_plans_${newId}`, { id: newId, ...value });
      try { if (editing) await api("records.replace", { collection: "competency_plans", id: newId, value }); else await api("records.create", { collection: "competency_plans", value, idempotency_key: `compplan-${newCompPlan.category}-${newCompPlan.year}-${Date.now()}` }); } catch {}
      if (editing) {
        const staleScores = compScores.filter(s => {
          if (s.planId !== newId && !(s.category === value.category && s.year === value.year)) return false;
          if (s.year !== value.year) return true;
          const mi = MONTH_INDEX[s.period] ?? -1; if (mi < 0) return true;
          if (value.feedback?.[mi]) return true;
          const planned = value.procedures?.[mi]; if (!planned) return true;
          if (s.procedure && s.procedure !== planned) return true;
          return false;
        });
        if (staleScores.length) {
          setCompScores(prev => prev.filter(s => !staleScores.some(x => x.id === s.id)));
          for (const s of staleScores) { try { await supabaseDelete(`competency_scores_${s.id}`); } catch {} try { await api("records.delete", { collection: "competency_scores", id: s.id }); } catch {} }
          setLiveToast(`Part 2 plan updated — ${staleScores.length} score(s) cleared: plan no longer matches (year / procedure / Feedback).`);
        } else setLiveToast("Part 2 plan updated.");
      } else setLiveToast("Part 2 plan created.");
      setCategory(newCompPlan.category); setEditingCompPlanId(null); setCompProcSearch(Array(12).fill(undefined as any)); setOpenProcIdx(null);
    } catch (err: any) { setSaveMsg(`Could not create Part 2 plan: ${err.message}`); }
    setBusy(false);
  }
  async function changePassword(e: React.FormEvent) {
    e.preventDefault(); setPwdMsg("");
    if (pwdForm.username === "master" && user?.role !== "Master") { setPwdMsg("Only Master can change Master's password."); return; }
    if (!pwdForm.password || pwdForm.password.length < 4) { setPwdMsg("Choose a password of at least 4 characters."); return; }
    if (pwdForm.password !== pwdConfirm) { setPwdMsg("Passwords do not match."); return; }
    setBusy(true);
    try {
      const existing = overrides.find(o => o.username === pwdForm.username);
      const newId = existing ? existing.id : `pwd-${Date.now()}`;
      const val = { username: pwdForm.username, password: pwdForm.password };
      if (existing) setOverrides(prev => prev.map(o => o.id === existing.id ? { ...o, ...val } : o)); else setOverrides(prev => [...prev, { id: newId, ...val }]);
      await syncSaveFirst(`audit_passwords_${pwdForm.username}`, { id: newId, ...val });
      if (existing) await api("records.replace", { collection: "audit_passwords", id: existing.id, value: val }).catch(() => {});
      else await api("records.create", { collection: "audit_passwords", value: val, idempotency_key: `pwd-${pwdForm.username}-${Date.now()}` }).catch(() => {});
      setPwdMsg(`Password updated for ${pwdForm.username}.`); setPwdForm({ ...pwdForm, password: "" }); setPwdConfirm("");
    } catch (err: any) { setPwdMsg(`Could not update: ${err.message}`); }
    setBusy(false);
  }

  function toggleInstAssignment(a: string) { setInstForm(prev => ({ ...prev, assignments: prev.assignments.includes(a) ? prev.assignments.filter(x => x !== a) : [...prev.assignments, a] })); }
  async function saveInstitution(e: React.FormEvent) {
    e.preventDefault(); setInstMsg("");
    const cleanName = cleanInstitutionName(instForm.name, instForm.wilayat);
    if (!cleanName) { setInstMsg("Enter an institution name."); return; }
    if (instForm.assignments.length === 0) { setInstMsg("Tick at least one assignment."); return; }
    setBusy(true);
    try {
      const newId = editingInst?.sourceId || `inst-${Date.now()}`;
      const val = { kind: editingInst ? "edit" : "add", wilayat: instForm.wilayat, name: cleanName, assignments: instForm.assignments, originalWilayat: editingInst?.wilayat, originalName: editingInst?.institution };
      if (editingInst) setInstOverrides(prev => prev.map(x => x.id === newId ? { ...x, ...val, id: newId } as InstOverride : x)); else setInstOverrides(prev => [...prev, { id: newId, ...val } as InstOverride]);
      await syncSaveFirst(`audit_institutions_${newId}`, { id: newId, ...val });
      setInstMsg(`Institution "${cleanName}" saved.`); setEditingInst(null); setInstForm({ wilayat: "Suhar", name: "", assignments: ["Part 1"] });
    } catch (err: any) { setInstMsg(`Could not save: ${err.message}`); }
    setBusy(false);
  }

  function normalizeProcName(raw: string, tag: string) { const trimmed = raw.trim(); if (tag === "LR" || tag === "RMC") { const base = stripProcedurePrefix(trimmed); return `[${tag}] ${base}`; } return trimmed; }
  async function saveProcedure(e: React.FormEvent) {
    e.preventDefault(); setProcMsg("");
    const finalName = normalizeProcName(procForm.name, procForm.tag);
    if (!finalName) { setProcMsg("Enter a procedure name."); return; }
    setBusy(true);
    try {
      const newId = editingProc?.sourceId || `proc-${Date.now()}`;
      const val = { kind: editingProc ? "edit" : "add", name: finalName, originalName: editingProc?.originalName || editingProc?.name };
      if (editingProc) setProcOverrides(prev => prev.map(x => x.id === newId ? { ...x, ...val, id: newId } as ProcOverride : x)); else setProcOverrides(prev => [...prev, { id: newId, ...val } as ProcOverride]);
      await syncSaveFirst(`audit_procedures_${newId}`, { id: newId, ...val });
      setProcMsg(`Procedure "${finalName}" saved.`); setEditingProc(null); setProcForm({ name: "", tag: "General" });
    } catch (err: any) { setProcMsg(`Could not save: ${err.message}`); }
    setBusy(false);
  }

  async function deleteInstitution(inst: EffInst) {
    if (!window.confirm(`Delete institution "${inst.institution}" in ${inst.wilayat}? This will hide it from Audit Grid and Plans.`)) return;
    setBusy(true);
    try {
      const newId = inst.sourceId || `inst-del-${Date.now()}`;
      const val: InstOverride = { id: newId, kind: "delete", wilayat: inst.wilayat, name: inst.institution, assignments: [], originalWilayat: inst.wilayat, originalName: inst.institution };
      // Add tombstone so merge logic removes it immediately
      setInstOverrides(prev => {
        // Remove any previous add/edit for same key, then add delete
        const filtered = prev.filter(x => !(x.originalName === inst.institution && (x.originalWilayat || x.wilayat) === inst.wilayat) && !(x.name === inst.institution && x.wilayat === inst.wilayat));
        return [...filtered, val];
      });
      lastSaveAtRef.current = Date.now();
      await syncSaveFirst(`audit_institutions_${newId}`, { id: newId, ...val });
      setInstMsg(`Institution "${inst.institution}" deleted.`);
      if (editingInst && editingInst.wilayat === inst.wilayat && editingInst.institution === inst.institution) {
        setEditingInst(null); setInstForm({ wilayat: "Suhar", name: "", assignments: ["Part 1"] });
      }
    } catch (err: any) { setInstMsg(`Could not delete: ${err.message}`); }
    setBusy(false);
  }

  async function deleteProcedure(procName: string) {
    if (!window.confirm(`Delete procedure "${procName}"? It will be removed from dropdowns and shown as "(Removed procedure)" in old plans.`)) return;
    setBusy(true);
    try {
      const newId = `proc-del-${Date.now()}`;
      const val: ProcOverride = { id: newId, kind: "delete", name: procName, originalName: procName };
      setProcOverrides(prev => {
        const filtered = prev.filter(x => x.name !== procName && x.originalName !== procName);
        return [...filtered, val];
      });
      lastSaveAtRef.current = Date.now();
      await syncSaveFirst(`audit_procedures_${newId}`, { id: newId, ...val });
      setProcMsg(`Procedure "${procName}" deleted.`);
      if (editingProc && editingProc.name === procName) {
        setEditingProc(null); setProcForm({ name: "", tag: "General" });
      }
    } catch (err: any) { setProcMsg(`Could not delete: ${err.message}`); }
    setBusy(false);
  }

  const part1Total = Object.values(effPart1).reduce((a, b) => a + b.length, 0);

  // ---------- FIXED HEADER LAYOUT ----------
  const CompactHeader = (
    <header data-safe-area-sticky-top style={{ top: "var(--safe-area-inset-top)" }} className="noprint sticky z-10 border-b border-white/10 bg-[var(--teal)] text-white">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3">
        <img src={mohLogo} alt="MOH Logo" className="h-10 w-auto shrink-0 rounded-lg bg-white p-1 object-contain" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
            <h1 className="truncate text-[15px] font-black leading-tight sm:text-[17px]">NBG - Nursing Audit System</h1>
            <span className="hidden text-xs font-semibold text-white/80 sm:inline">DGHS • {headerRoleText}</span>
            <span className="truncate text-[11px] font-semibold text-white/80 sm:hidden">{headerRoleText} • {user?.wilayat}</span>
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">{user?.wilayat}</span>
          <button type="button" onClick={() => setShowHelp(true)} className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold hover:bg-white/25">Guide</button>
          <button type="button" onClick={logout} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-[var(--teal)] hover:bg-white/90"><LogOut className="mr-1 inline" size={14} />Logout</button>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:hidden">
          <button type="button" onClick={() => setShowHelp(true)} aria-label="Guide" className="rounded-full bg-white/15 p-2"><HelpCircle size={18} /></button>
          <button type="button" onClick={logout} aria-label="Logout" className="rounded-full bg-white p-2 text-[var(--teal)]"><LogOut size={18} /></button>
        </div>
      </div>
    </header>
  );

  const SecondaryBar = (
    <div className="noprint border-b border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-4 py-2.5">
        <button
          type="button"
          onClick={manualRefresh}
          disabled={refreshing}
          className="flex min-h-[40px] items-center gap-2 rounded-full bg-[var(--teal)] px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-[var(--teal2)] disabled:opacity-60"
          style={{ touchAction: 'manipulation' }}
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {liveStatus === "refreshing" ? (
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--surface2)] px-3 py-1.5 text-xs font-bold"><RefreshCw size={12} className="animate-spin" />Refreshing...</span>
          ) : isSupabaseConfigured && supabaseConnected ? (
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--surface2)] px-3 py-1.5 text-xs font-bold"><span className="h-2.5 w-2.5 rounded-full bg-green-500" />Live • Supabase • Connected</span>
          ) : isSupabaseConfigured ? (
            <span className="flex items-center gap-2"><span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-800"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Local only • Supabase not connected: {supabaseReason || "unknown"}</span><button type="button" onClick={manualRefresh} disabled={refreshing} className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white">Retry</button></span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--surface2)] px-3 py-1.5 text-xs font-bold"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Local mode</span>
          )}
        </div>
        <div className="ml-auto hidden text-[11px] font-semibold text-[var(--muted)] sm:block">Tap Refresh to load latest scores — shared link works on any phone</div>
      </div>
    </div>
  );

  const PartTabsBar = (
    <div className="noprint border-b border-[var(--teal2)] bg-[var(--teal)]">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-4 py-2.5">
        <div className="flex gap-2">
          <button onClick={() => { setPart("1"); setTab("Dashboard"); setSelectedCell(null); }} aria-pressed={part === "1"} className={`rounded-full px-4 py-2 text-sm font-black ${part === "1" ? "bg-white text-[var(--teal)]" : "bg-white/15 border border-white/40 text-white hover:bg-white/25"}`}>Part 1 — Documentation</button>
          <button onClick={() => { setPart("2"); setTab("Dashboard"); setSelectedCell(null); }} aria-pressed={part === "2"} className={`rounded-full px-4 py-2 text-sm font-black ${part === "2" ? "bg-white text-[var(--teal)]" : "bg-white/15 border border-white/40 text-white hover:bg-white/25"}`}>Part 2 — Competency</button>
        </div>
        <div className="ml-2 hidden h-6 w-px bg-[var(--line)] sm:block" />
        <nav className="no-scrollbar flex flex-nowrap gap-1 overflow-x-auto sm:flex-wrap sm:overflow-visible">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-bold ${tab === t ? "bg-white text-[var(--teal)]" : "bg-white/15 border border-white/40 text-white hover:bg-white/25"}`}>{t}</button>
          ))}
        </nav>
      </div>
    </div>
  );

  return (
    <div data-safe-area-inset-root style={{ boxSizing: "border-box", paddingTop: "var(--safe-area-inset-top)", minHeight: "100vh", background: "var(--bg)" }} className="overflow-x-clip">
      {!user ? (
        <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6">
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="rounded-2xl bg-white p-3 shadow-sm"><img src={mohLogo} alt="Ministry of Health logo" className="h-[76px] w-auto object-contain sm:h-[84px]" /></div>
            <p className="mt-3 text-xs font-bold tracking-[.2em] uppercase text-[var(--muted)]">DGHS</p>
            <h1 className="mt-2 text-[clamp(1.8rem,5vw,2.8rem)] font-black leading-[1.05]">NBG - Nursing Audit System</h1>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            <div className="grid md:grid-cols-2">
              <div className="flex flex-col bg-[var(--teal)] p-6 text-white sm:p-8">
                <p className="mt-4 max-w-md text-white/90">Submit audit results by plan, keep comments with every score, and see completion and averages update as Wilayats enter their work.</p>
                <div className="mt-8 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white/15 p-3"><div className="text-2xl font-black">{part1Total}</div><div className="text-xs">Institutions</div></div>
                  <div className="rounded-xl bg-white/15 p-3"><div className="text-2xl font-black">6</div><div className="text-xs">Wilayats</div></div>
                  <div className="rounded-xl bg-white/15 p-3"><div className="text-2xl font-black">4</div><div className="text-xs">Topics</div></div>
                </div>
                <div className="mt-6 text-sm text-white/85"><strong>Wilayats:</strong> {WILAYAT_ORDER.map(w => `${w} (${(effPart1[w] || []).length})`).join(" · ")}</div>
                <div className="mt-4 rounded-xl bg-white/10 p-3 text-sm"><strong>Part 2 — Competency Procedures:</strong> General Nursing, Renal Medicine Center, Labour Rooms. Same logins, separate plans and scores.</div>
                <p className="mt-auto pt-6 text-center text-sm font-bold text-white">Brought to you by: Juma Al Marzouqi [Saham Hospital]</p>
                <p className="mt-3 text-center text-xs text-white/70">{isSupabaseConfigured ? "Live • Supabase • Shared Database" : "Local mode — add VITE_SUPABASE env to enable cross-PC sync"}</p>
              </div>
              <div className="p-5 sm:p-7">
                <h2 className="text-xl font-extrabold">Sign in</h2><p className="text-sm text-[var(--muted)]">Choose account and type password.</p>
                <form onSubmit={login} className="mt-4 space-y-3">
                  <label className="block text-sm font-bold">Username<input value={username} onChange={e => setUsername(e.target.value)} className="mt-1 w-full" autoComplete="username" /></label>
                  <label className="block text-sm font-bold relative">Password<div className="relative mt-1"><input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full pr-10" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-2 top-1/2 -translate-y-1/2 text-lg" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "🙈" : "👁️"}</button></div></label>
                  {security.locked && <label className="block text-sm font-bold">Recovery Code <span className="text-red-600">* Required for Master Unlock</span><input type="password" value={recoveryInput} onChange={e => setRecoveryInput(e.target.value)} className="mt-1 w-full" placeholder="Recovery Code set by Master" autoComplete="off" /></label>}
                  {security.accessCodeEnabled && <label className="block text-sm font-bold">Directorate Access Code <span className="text-red-600">* Required</span><input type="password" value={accessCodeInput} onChange={e => setAccessCodeInput(e.target.value)} className="mt-1 w-full" placeholder="Directorate Access Code" autoComplete="off" /></label>}
                  {loginError && <p className="rounded-lg bg-[var(--red)] p-2 text-sm font-semibold">{loginError}</p>}
                  <button className="w-full rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white">{security.locked ? "Master Unlock" : "Sign in"}</button>
                </form>
                {/* Demo login grid removed — browser was offering saved admin password and user requested removal */}


              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {CompactHeader}
          {SecondaryBar}
          {PartTabsBar}

          <main className="mx-auto max-w-[1500px] px-3 py-4 pb-6 sm:px-5 sm:py-6 sm:pb-6">
            {liveToast && <div role="status" className="mb-4 flex items-start justify-between gap-2 rounded-xl border border-[var(--teal)] bg-[var(--surface)] p-3 text-sm font-bold shadow"><span>{liveToast}</span><button type="button" onClick={() => setLiveToast(null)} aria-label="Dismiss notification" className="shrink-0 rounded-full border px-2 py-0.5 text-xs">Dismiss</button></div>}

            {backendError && <div className="mb-4 rounded-xl bg-[var(--red)] p-3 text-sm font-bold">{backendError}</div>}

            {tab === "Control Panel" && isAdmin && (
              <section>
                <h2 className="text-xl font-black">Control Panel</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">Same panel in Part 1 and Part 2. Passwords, institutions, and procedures are saved in the shared database (audit_data) and apply immediately. {dbLabel}</p>
                <div className="mt-4 card p-4"><h3 className="font-extrabold">Assignments by Year — Link Category to Year Plan</h3><p className="mt-1 text-sm text-[var(--muted)]">Variable by year, not permanent. If no plan for Labour Rooms / RMC in a year, assign those institutions to General Nursing for that year. Saham & Suwaiq: General Nursing only in 2027, General + Labour Rooms in 2028. Shinas LR can move between categories.</p>
                  <div className="mt-3 flex flex-wrap gap-3 items-end"><label className="text-sm font-bold">Year<select value={assignYear} onChange={e => setAssignYear(Number(e.target.value))} className="mt-1 w-24">{[2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037,2038,2039,2040].map(y => <option key={y} value={y}>{y}</option>)}</select></label><span className="text-xs text-[var(--muted)]">Showing {assignYear} assignments. Tick = appears in that category grid for {assignYear} plan.</span><button type="button" disabled={busy} onClick={async () => { setBusy(true); setInstMsg(`Saving all ${effInstList.length} institutions for ${assignYear}...`); try { const promises = effInstList.map(e => { const k = `${e.wilayat}||${e.institution}||${assignYear}`; const cur = yearAssignments[k] !== undefined ? yearAssignments[k] : e.assignments; const assignId = `audit_institution_assignments_${e.wilayat.replace(/\s+/g,'_')}_${e.institution.replace(/\s+/g,'_')}_${assignYear}`; return syncSaveFirst(assignId, { id: assignId, wilayat: e.wilayat, institution: e.institution, year: String(assignYear), assignments: cur }); }); await Promise.all(promises); setInstMsg(`Saved all ${effInstList.length} institutions for ${assignYear} at ${new Date().toLocaleTimeString()} — Saham & Suwaiq & Shinas LR assignments linked to ${assignYear} plan.`); } catch (err:any) { setInstMsg(`Save failed: ${err.message}`); } setBusy(false); }} className="rounded-lg bg-[var(--teal)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Save All for {assignYear}</button></div>
                  {instMsg && instMsg.includes(String(assignYear)) && <p className="mt-2 rounded bg-[var(--surface2)] p-2 text-sm font-bold text-[var(--teal)]">{instMsg}</p>}
                  <div className="mt-3 max-h-[420px] overflow-auto space-y-2">{effInstList.map(e => {
                    const k = `${e.wilayat}||${e.institution}||${assignYear}`;
                    const cur = yearAssignments[k] !== undefined ? yearAssignments[k] : e.assignments;
                    const isCustom = k in yearAssignments;
                    return <div key={k} className="rounded-lg border p-2"><div className="flex justify-between"><span className="text-sm font-bold">{e.institution} <span className="text-xs font-normal text-[var(--muted)]">· {e.wilayat} {isCustom ? "· Year-specific" : "· Permanent"}</span></span></div><div className="mt-2 flex flex-wrap gap-2">{["Part 1","General Nursing","Renal Medicine Center","Labour Rooms"].map(cat => <label key={cat} className="flex items-center gap-1 text-xs font-semibold"><input type="checkbox" checked={cur.includes(cat)} onChange={() => { const nxt = cur.includes(cat) ? cur.filter(c => c !== cat) : [...cur, cat]; setYearAssignments(p => ({ ...p, [k]: nxt })); }} className="w-auto" /> {cat}</label>)}</div></div>;
                  })}</div>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <form onSubmit={saveInstitution} className="card p-4"><h3 className="font-extrabold">{editingInst ? "Edit institution" : "Add institution"}</h3><label className="mt-3 block text-sm font-bold">Wilayat<select value={instForm.wilayat} onChange={e => setInstForm({ ...instForm, wilayat: e.target.value })} className="mt-1 w-full">{WILAYAT_ORDER.map(w => <option key={w} value={w}>{w}</option>)}</select></label><label className="mt-3 block text-sm font-bold">Institution name<input value={instForm.name} onChange={e => setInstForm({ ...instForm, name: e.target.value })} className="mt-1 w-full" placeholder="e.g. Khaboorah EHC" /></label><fieldset className="mt-3"><legend className="text-sm font-bold">Assignments (Permanent — applies to all years unless overridden in Assignments by Year manager above)</legend>{["Part 1", "General Nursing", "Renal Medicine Center", "Labour Rooms"].map(a => <label key={a} className="mt-2 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={instForm.assignments.includes(a)} onChange={() => toggleInstAssignment(a)} className="w-auto" /> {a}</label>)}</fieldset>{instMsg && <p className="mt-3 rounded bg-[var(--surface2)] p-2 text-sm font-semibold">{instMsg}</p>}<div className="mt-4 flex gap-2"><button disabled={busy} className="flex-1 rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white disabled:opacity-50">{editingInst ? "Save changes" : "Add institution"}</button>{editingInst && <button type="button" onClick={() => { setEditingInst(null); setInstForm({ wilayat: "Suhar", name: "", assignments: ["Part 1"] }); }} className="rounded-lg border px-3 py-2 font-bold">Cancel</button>}</div></form>
                  <div className="card p-4"><h3 className="font-extrabold">Institutions ({effInstList.length})</h3><div className="mt-3 space-y-2 max-h-[420px] overflow-auto">{WILAYAT_ORDER.map(w => { const items = effInstList.filter(e => e.wilayat === w); if (!items.length) return null; return <div key={w}><h4 className="font-bold">{w} — {items.length}</h4><div className="mt-1 space-y-1">{items.map(e => <div key={e.wilayat + e.institution} className="flex items-center gap-2 rounded border p-2 text-sm"><span className="font-bold [overflow-wrap:anywhere]">{e.institution}</span><span className="text-xs text-[var(--muted)]">{e.assignments.join(" · ")}</span><div className="ml-auto flex gap-1"><button type="button" onClick={() => { setEditingInst(e); setInstForm({ wilayat: e.wilayat, name: e.institution, assignments: [...e.assignments] }); }} className="rounded-full border px-2 py-1 text-xs font-bold">Edit</button><button type="button" onClick={() => deleteInstitution(e)} className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-100">Delete</button></div></div>)}</div></div>; })}</div></div>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {isMaster && <div className="card p-4"><h3 className="flex items-center gap-2 font-extrabold"><Users size={18} /> Accounts — Master only</h3><p className="mt-1 text-xs text-[var(--muted)]">Latest passwords from Supabase (audit_data). Visible only to Master.</p><div className="mt-3 space-y-2">{effectiveUsers.map(u => <div key={u.username} className="flex justify-between gap-2 rounded-lg border p-3 text-sm"><span><strong>{u.label}</strong> — {u.username} · {u.role} · {u.wilayat}</span><span className="text-[var(--muted)]">Password: {u.password}</span></div>)}</div></div>}
                  {isMaster && (
                  <form onSubmit={changePassword} className="card p-4"><h3 className="font-extrabold">Change a password — Master only</h3><p className="mt-1 text-xs text-[var(--muted)]">Only Master can change passwords. Latest passwords from Supabase appear in Accounts board.</p><label className="mt-3 block text-sm font-bold">Account<select value={pwdForm.username} onChange={e => setPwdForm({ ...pwdForm, username: e.target.value })} className="mt-1 w-full">{effectiveUsers.filter(u => u.username !== "master").map(u => <option key={u.username} value={u.username}>{u.label} ({u.username}) — {u.role}</option>)}</select></label><label className="mt-3 block text-sm font-bold">New password<div className="mt-1 flex gap-2"><input type={showPwd ? "text" : "password"} value={pwdForm.password} onChange={e => setPwdForm({ ...pwdForm, password: e.target.value })} className="flex-1" placeholder="At least 4 characters" /><button type="button" onClick={() => setShowPwd(!showPwd)} className="rounded-lg border px-3 text-sm font-bold" aria-label={showPwd ? "Hide password" : "Show password"}>{showPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label><label className="mt-3 block text-sm font-bold">Confirm new password<input type={showPwd ? "text" : "password"} value={pwdConfirm} onChange={e => setPwdConfirm(e.target.value)} className="mt-1 w-full" placeholder="Re-enter new password" /></label>{pwdMsg && <p className="mt-3 rounded bg-[var(--surface2)] p-2 text-sm font-semibold">{pwdMsg}</p>}<button disabled={busy} className="mt-4 w-full rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white disabled:opacity-50">Update password</button></form>
                )}
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <form onSubmit={saveProcedure} className="card p-4"><h3 className="font-extrabold">{editingProc ? "Edit procedure" : "Add procedure"}</h3><label className="mt-3 block text-sm font-bold">Procedure name<input value={procForm.name} onChange={e => setProcForm({ ...procForm, name: e.target.value })} className="mt-1 w-full" placeholder="e.g. IV Cannulation" /></label><label className="mt-3 block text-sm font-bold">Tag<select value={procForm.tag} onChange={e => setProcForm({ ...procForm, tag: e.target.value })} className="mt-1 w-full"><option value="General">General</option><option value="LR">[LR]</option><option value="RMC">[RMC]</option></select></label>{procMsg && <p className="mt-3 rounded bg-[var(--surface2)] p-2 text-sm font-semibold">{procMsg}</p>}<div className="mt-4 flex gap-2"><button disabled={busy} className="flex-1 rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white disabled:opacity-50">{editingProc ? "Save changes" : "Add procedure"}</button>{editingProc && <button type="button" onClick={() => { setEditingProc(null); setProcForm({ name: "", tag: "General" }); }} className="rounded-lg border px-3 py-2 font-bold">Cancel</button>}</div></form>
                  <div className="card p-4"><h3 className="font-extrabold">Procedures ({effectiveProcedures.length})</h3><div className="mt-3 flex gap-2"><input value={procSearch} onChange={e => setProcSearch(e.target.value)} placeholder="Search..." className="flex-1 text-sm" /><select value={procFilterTag} onChange={e => setProcFilterTag(e.target.value)} className="text-sm"><option value="All">All</option><option value="General">General</option><option value="LR">[LR]</option><option value="RMC">[RMC]</option></select></div><div className="mt-3 max-h-[420px] space-y-1 overflow-auto">{effectiveProcedures.filter(p => { if (procFilterTag !== "All" && procTag(p) !== procFilterTag) return false; if (procSearch && !p.toLowerCase().includes(procSearch.toLowerCase())) return false; return true; }).map(p => <div key={p} className="flex items-center gap-2 rounded border p-2 text-sm"><span className="chip bg-[var(--surface2)]">{procTag(p)}</span><span className="font-semibold [overflow-wrap:anywhere]">{p}</span><div className="ml-auto flex gap-1"><button type="button" onClick={() => { setEditingProc({ name: p }); setProcForm({ name: p, tag: procTag(p) }); }} className="rounded-full border px-2 py-1 text-xs font-bold">Edit</button><button type="button" onClick={() => deleteProcedure(p)} className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-100">Delete</button></div></div>)}</div></div>
                </div>
              </section>
            )}

            {tab === "Guide" && <section className="mx-auto max-w-[720px]"><div className="card p-4 sm:p-6"><h2 className="text-[clamp(1.4rem,5vw,1.9rem)] font-black leading-tight">Wilayat Quick Guide — How to Enter Scores on Your Phone</h2><p className="mt-2 text-[15px] text-[var(--muted)]">Simple steps for Wilayat users on a small phone.</p><div className="mt-5 space-y-5 text-[16px] leading-[1.5]"><div className="rounded-xl border bg-[var(--surface2)] p-4"><p className="font-black">Step 1: Open shared link</p><p className="mt-2">Open shared link on phone, log in with Wilayat account, e.g. suhar / suhar123. If no Refresh button, pull down to refresh.</p></div><div className="rounded-xl border p-4"><p className="font-black">Step 2: Choose Part</p><p>Choose Part 1 or Part 2 at top.</p></div><div className="rounded-xl border p-4"><p className="font-black">Step 3: Year and Topic/Category</p><p>Choose Year and Topic or Category — e.g. 2027 + Crash Cart.</p></div><div className="rounded-xl border p-4"><p className="font-black">Step 4: Audit Grid months</p><p>Swipe sideways to see months Jan-Dec. Turn ON Single month view for easiest entry.</p></div><div className="rounded-xl border p-4"><p className="font-black">Step 5: Tap a cell</p><p>Tap a cell, e.g. Saham Hospital • Jan. Bottom sheet opens: Score 0-100 or NA, Your Name mandatory, Comment optional, Save.</p></div><div className="rounded-xl border p-4"><p className="font-black">Step 6: Refresh</p><p>Tap Refresh at top to see latest scores from other Wilayats. Live status shows updated time. Supabase sync: Phone A saves → Phone B taps Refresh → sees score.</p></div></div><pre className="mt-4 whitespace-pre-wrap break-words text-[14px] bg-[var(--surface2)] p-3 rounded-xl">{GUIDE_TEXT}</pre></div></section>}

            {tab !== "Control Panel" && tab !== "Guide" && tab !== "Plans" && part === "1" && <>
              <section className="card mb-4 p-3 sm:p-4">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <div><label className="text-xs font-bold uppercase text-[var(--muted)]">Topic</label><div className="mt-1 flex flex-wrap gap-1">{TOPICS.map(t => <button key={t} onClick={() => { setTopic(t); setPlanId(""); }} className={`rounded-full px-3 py-1.5 text-sm font-bold ${topic === t ? "bg-[var(--teal)] text-white" : "border border-[var(--line)]"}`}>{t}</button>)}</div></div>
                  <div><label className="text-sm font-bold">Plan<select value={planId} onChange={e => setPlanId(e.target.value)} className="mt-1 w-full" style={{ minHeight: 44 }}><option value="">No plan for this topic</option>{plans.filter(p => p.topic === topic).map(p => <option key={p.id} value={p.id}>{p.year} · Monthly · 12 months{p.active ? " · Active" : ""}</option>)}</select></label></div>
                  <div className="flex flex-wrap items-end gap-2">
                    
                    <div className="flex gap-2"><button onClick={exportCSV} disabled={!activePlan} className="rounded-lg bg-[var(--blue)] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><Download className="mr-1 inline" size={16} />CSV</button></div>
                  </div>
                </div>
                {!activePlan && <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">No plan yet for <strong>{topic}</strong>. {isAdmin ? "Create one in Plans." : "Ask Admin to create a plan."}</div>}
              </section>

              {tab === "Dashboard" && <div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {isAdmin ? <>
                    <button onClick={exportPart1StatsExcel} className="flex items-center gap-2 rounded-xl bg-[var(--teal)] px-6 py-3 text-sm font-black text-white shadow-md"><Download size={18} />Export Part 1 Statistics Excel</button>
                  </> : <button onClick={exportPart1StatsExcel} className="flex items-center gap-2 rounded-xl bg-[var(--teal)] px-6 py-3 text-sm font-black text-white shadow-md"><Download size={18} />Export My Statistics Excel</button>}
                  <span className="self-center text-xs text-[var(--muted)]">{dbLabel} • Asia/Muscat • real .xlsx</span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <section className="card p-4 lg:col-span-2"><h2 className="flex items-center gap-2 font-extrabold"><BarChart3 size={18} /> Summary — {topic}</h2><div className="mt-3 grid gap-3 sm:grid-cols-2"> <div className="rounded-xl bg-[var(--surface2)] p-3"><div className="text-xs text-[var(--muted)]">Completion</div><div className="text-xl font-black">{gridStats.completion.toFixed(1)}%</div></div><div className="rounded-xl bg-[var(--surface2)] p-3"><div className="text-xs text-[var(--muted)]">Audits</div><div className="text-xl font-black">{gridStats.count}</div></div><div className="rounded-xl bg-[var(--surface2)] p-3"><div className="text-xs text-[var(--muted)]">Average</div><div className="text-xl font-black">{gridStats.avg ? gridStats.avg.toFixed(2) + "%" : "—"}</div></div><div className="rounded-xl bg-[var(--surface2)] p-3"><div className="text-xs text-[var(--muted)]">Missing</div><div className="text-xl font-black">{gridStats.missing}</div></div></div></section>
                  <section className="card p-4"><h3 className="font-bold">Sync status</h3><p className="mt-2 text-sm"><strong>Last sync:</strong> {lastSyncAt ? formatMuscat(lastSyncAt) : "—"}</p><p className="mt-1 text-sm"><strong>Supabase connected:</strong> {isSupabaseConfigured && supabaseConnected ? "Yes" : "No"}{isSupabaseConfigured && !supabaseConnected && supabaseReason ? ` — ${supabaseReason}` : ""}</p><p className="mt-1 text-sm"><strong>Rows loaded:</strong> {syncRowsLoaded}</p>{isSupabaseConfigured && !supabaseConnected && <button type="button" onClick={manualRefresh} disabled={refreshing} className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white">Retry sync</button>}<p className="mt-2 text-xs text-[var(--muted)]">{dbLabel}</p></section>
                </div>
              </div>}

              {tab === "Audit Grid" && <section className="card p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap gap-4 text-sm"><span><strong>{topic}</strong> · {activePlan ? `${activePlan.year} · Monthly · 12 months` : "No plan"}</span><span>Completion <strong>{gridStats.completion.toFixed(1)}%</strong></span><span>Audits <strong>{gridStats.count}</strong></span><span>Average <strong>{gridStats.avg ? gridStats.avg.toFixed(2) + "%" : "—"}</strong></span><span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">{dbLabel}</span></div>
                {!activePlan ? <p className="text-sm text-[var(--muted)]">Select or create a plan to see the grid.</p> : <>

                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <label className="w-full text-sm font-bold sm:w-auto">Jump to institution<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search institution…" className="mt-1 w-full sm:w-[220px]" /></label>
                    <button type="button" onClick={() => setSingleMonthView(!singleMonthView)} aria-pressed={singleMonthView} className={`rounded-full px-4 py-2 text-sm font-bold ${singleMonthView ? "bg-[var(--teal)] text-white" : "border bg-white"}`}>{singleMonthView ? "Single month view: ON" : "Single month view: OFF"}</button>
                  </div>
                  <div className="mb-2"><label className="text-xs font-bold uppercase text-[var(--muted)]">Month picker</label><div className="no-scrollbar mt-1 flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Month picker">{MONTHS.map((m, mi) => <button key={m} type="button" onClick={() => { setMobileMonthIdx(mi); const el = gridRef.current?.querySelector(`[data-month="${m}"]`); if (gridRef.current && el) gridRef.current.scrollLeft = Math.max(0, (el as HTMLElement).offsetLeft - 180); }} aria-pressed={mobileMonthIdx === mi} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold ${mobileMonthIdx === mi ? "bg-[var(--teal)] text-white" : "border bg-white"}`}>{m}</button>)}</div></div>
                  <p className="mb-2 text-sm font-semibold">← Swipe to see months on mobile → Desktop shows full table</p>
                  <div ref={gridRef} className="gridwrap">
                    <table className="excel">
                      <thead><tr><th>Institution</th>{(singleMonthView ? [MONTHS[mobileMonthIdx]] : MONTHS).map(m => <th key={m} data-month={m}>{m}</th>)}</tr></thead>
                      <tbody>
                        {visibleInstitutions.map(v => {
                          const isEditingRow = selectedCell && selectedCell.wilayat === v.wilayat && selectedCell.institution === v.institution && selectedCell.part !== "2";
                          return <tr key={v.wilayat + v.institution} className={isEditingRow ? "editing-row" : ""}>
                            <td className="font-bold [overflow-wrap:anywhere]">{labelFor(v.wilayat, v.institution)}<span className="block text-xs font-normal text-[var(--muted)]">{v.wilayat}</span></td>
                            {(singleMonthView ? [MONTHS[mobileMonthIdx]] : MONTHS).map(period => {
                              const s = findScore(v.wilayat, v.institution, period);
                              const isEditingCell = selectedCell && selectedCell.wilayat === v.wilayat && selectedCell.institution === v.institution && selectedCell.period === period && selectedCell.part !== "2";
                              return <td key={period} className={isEditingCell ? "editing-cell" : ""} style={s ? scoreColor(s.score) : {}}>
                                <button
                                  type="button"
                                  onClick={() => openCell(v, period)}
                                  className={`cellBtn ${s?.comment ? "hasComment" : ""}`}
                                  style={{ touchAction: 'manipulation', cursor: 'pointer', minHeight: 44, color: "inherit", fontWeight: 800 }}
                                  aria-label={`Edit ${labelFor(v.wilayat, v.institution)} ${period} score ${s?.score || "empty"}`}
                                >
                                  {s ? s.score : "—"}
                                </button>
                              </td>;
                            })}
                          </tr>;
                        })}
                      </tbody>
                    </table>
                  </div>
                  {visibleInstitutions.length === 0 && <p className="mt-3 text-sm text-[var(--muted)]">No institutions match your filter.</p>}
                </>}
              </section>}

              {tab === "Comments" && <section className="card p-4"><h2 className="flex items-center gap-2 font-extrabold"><MessageSquare size={18} /> Comments — {topic}</h2><p className="mt-1 text-sm text-[var(--muted)]">{dbLabel} {isAdmin ? "· Master/Admin sees all Wilayats" : `· Only ${user?.wilayat} comments`}</p>
                <div className="mt-3 space-y-3">{planScores.filter(s => (s.comment || s.auditorName) && (isAdmin || s.wilayat === user?.wilayat)).map(c => <article key={c.id} className="rounded-xl border p-3"><div className="flex justify-between"><p className="font-bold">{labelFor(c.wilayat, c.institution)} — {c.period}</p><span className="font-black">{c.score}</span></div><p className="mt-1 text-sm [overflow-wrap:anywhere]">{c.comment || "No comment"}</p><p className="mt-1 text-xs text-[var(--muted)]">Audited by: {c.auditorName || "—"} · Added at: {c.auditedAt ? formatMuscat(c.auditedAt) : "—"} · {c.wilayat}</p></article>)}{planScores.filter(s => (s.comment || s.auditorName) && (isAdmin || s.wilayat === user?.wilayat)).length === 0 && <p className="text-sm">No comments yet.</p>}</div>
              </section>}
            </>}

            {tab !== "Control Panel" && tab !== "Guide" && tab !== "Plans" && part === "2" && <>
              <section className="card mb-4 p-3 sm:p-4">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <div><label className="text-xs font-bold uppercase text-[var(--muted)]">Category</label><div className="mt-1 flex flex-wrap gap-1">{CATEGORIES.map(c => <button key={c} onClick={() => { setCategory(c); setCompPlanId(""); }} className={`rounded-full px-3 py-1.5 text-sm font-bold ${category === c ? "bg-[var(--teal)] text-white" : "border border-[var(--line)]"}`}>{c}</button>)}</div></div>
                  <div><label className="text-sm font-bold">Plan<select value={compPlanId} onChange={e => setCompPlanId(e.target.value)} className="mt-1 w-full" style={{ minHeight: 44 }}><option value="">No plan for this category</option>{compPlans.filter(p => p.category === category).map(p => <option key={p.id} value={p.id}>{p.year} · Monthly · 12 months{p.active ? " · Active" : ""}</option>)}</select></label></div>
                  <div className="flex flex-wrap items-end gap-2">
                    
                    <button onClick={exportCSV} disabled={!activeCompPlan} className="rounded-lg bg-[var(--blue)] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><Download className="mr-1 inline" size={16} />CSV</button>
                  </div>
                </div>
              </section>

              {tab === "Dashboard" && <div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={exportPart2StatsExcel} className="flex items-center gap-2 rounded-xl bg-[var(--teal)] px-6 py-3 text-sm font-black text-white shadow-md"><Download size={18} />Export Part 2 Statistics Excel</button>
                  <button onClick={exportCompPlanWord} className="flex items-center gap-2 rounded-xl bg-[var(--blue)] px-6 py-3 text-sm font-black text-white shadow-md"><Download size={18} />Export Competency Plan to Word</button>
                  <span className="self-center text-xs text-[var(--muted)]">{dbLabel} • real .xlsx</span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <section className="card p-4 lg:col-span-2"><h2 className="flex items-center gap-2 font-extrabold"><BarChart3 size={18} /> Summary — {category}</h2><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[var(--surface2)] p-3"><div className="text-xs text-[var(--muted)]">Completion</div><div className="text-xl font-black">{compGridStats.completion.toFixed(1)}%</div></div><div className="rounded-xl bg-[var(--surface2)] p-3"><div className="text-xs text-[var(--muted)]">Audits (blocks)</div><div className="text-xl font-black">{compGridStats.count}</div></div><div className="rounded-xl bg-[var(--surface2)] p-3"><div className="text-xs text-[var(--muted)]">Average</div><div className="text-xl font-black">{compGridStats.avg ? compGridStats.avg.toFixed(2) + "%" : "—"}</div></div><div className="rounded-xl bg-[var(--surface2)] p-3"><div className="text-xs text-[var(--muted)]">Missing</div><div className="text-xl font-black">{compGridStats.missing}</div></div></div></section>
                  <section className="card p-4"><h3 className="font-bold">Blocks</h3><p className="mt-2 text-sm">Part 2 uses block system: same procedure in consecutive months = one block, one score per block.</p><div className="mt-3 border-t pt-3"><h4 className="font-bold">Sync status</h4><p className="mt-1 text-sm"><strong>Last sync:</strong> {lastSyncAt ? formatMuscat(lastSyncAt) : "—"}</p><p className="mt-1 text-sm"><strong>Supabase connected:</strong> {isSupabaseConfigured && supabaseConnected ? "Yes" : "No"}{isSupabaseConfigured && !supabaseConnected && supabaseReason ? ` — ${supabaseReason}` : ""}</p><p className="mt-1 text-sm"><strong>Rows loaded:</strong> {syncRowsLoaded}</p>{isSupabaseConfigured && !supabaseConnected && <button type="button" onClick={manualRefresh} disabled={refreshing} className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white">Retry sync</button>}</div></section>
                </div>
              </div>}

              {tab === "Audit Grid" && <section className="card p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap gap-4 text-sm"><span><strong>{category}</strong> · {activeCompPlan ? `${activeCompPlan.year} · Monthly · ${getBlocks(activeCompPlan).length} blocks` : "No plan"}</span><span>Completion <strong>{compGridStats.completion.toFixed(1)}%</strong></span><span>Audits <strong>{compGridStats.count}</strong></span><span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">{dbLabel}</span></div>
                {!activeCompPlan ? <p className="text-sm text-[var(--muted)]">Select or create a plan to see the grid.</p> : <>

                  <div ref={gridRef} className="gridwrap">
                    <table className="excel">
                      <thead><tr><th>Institution / Procedure block</th>{activeCompPlan.periods.map((p, i) => <th key={i}>{p}<span className="block text-[10px] font-normal">{activeCompPlan.feedback?.[i] ? "Feedback" : displayProcedure(activeCompPlan.procedures?.[i])}</span></th>)}</tr></thead>
                      <tbody>
                        {visibleCompInstitutions.map(v => {
                          const isEditingRow = selectedCell && selectedCell.wilayat === v.wilayat && selectedCell.institution === v.institution && selectedCell.part === "2";
                          return <tr key={v.wilayat + v.institution} className={isEditingRow ? "editing-row" : ""}>
                            <td className="font-bold [overflow-wrap:anywhere]">{labelFor(v.wilayat, v.institution)}<span className="block text-xs font-normal text-[var(--muted)]">{v.wilayat}</span></td>
                            {activeCompPlan.periods.map((period, idx) => {
                              if (activeCompPlan.feedback?.[idx]) return <td key={idx} style={{ background: "#ede9fe" }} title="Obtaining Feedback"><span className="text-xs font-bold">Obtaining Feedback</span></td>;
                              if (!activeCompPlan.procedures?.[idx]) return <td key={idx}></td>;
                              const block = blockForMonth(activeCompPlan, idx); if (!block) return <td key={idx}></td>;
                              if (idx !== block.start) return null; // colSpan on the start cell already covers this month — rendering another <td> here shifted every later column (Apr-May looked covered in Jan, Jun-Jul looked blocked, Feedback appeared outside the table)
                              const s = findBlockScore(v.wilayat, v.institution, block);
                              const isEditingCell = selectedCell && selectedCell.wilayat === v.wilayat && selectedCell.institution === v.institution && selectedCell.period === period;
                              return <td key={idx} className={isEditingCell ? "editing-cell" : ""} style={s ? scoreColor(s.score) : {}} colSpan={block.end - block.start + 1}>
                                <button
                                  type="button"
                                  onClick={() => openCell(v, period, "2", category)}
                                  className={`cellBtn ${s?.comment ? "hasComment" : ""}`}
                                  style={{ touchAction: 'manipulation', cursor: 'pointer', minHeight: 44, color: "inherit", fontWeight: 800 }}
                                  aria-label={`Edit ${labelFor(v.wilayat, v.institution)} ${blockLabel(block)} ${s?.score || "empty"}`}
                                >
                                  {s ? s.score : "—"}
                                </button>
                              </td>;
                            })}
                          </tr>;
                        })}
                      </tbody>
                    </table>
                  </div>
                </>}
              </section>}

              {tab === "Comments" && <section className="card p-4"><h2 className="flex items-center gap-2 font-extrabold"><MessageSquare size={18} /> Comments — {category}</h2><p className="mt-1 text-sm text-[var(--muted)]">{dbLabel} {isAdmin ? "· Master/Admin sees all Wilayats" : `· Only ${user?.wilayat} comments`}</p>
                <div className="mt-3 space-y-3">{compPlanScores.filter(s => (s.comment || s.auditorName) && (isAdmin || s.wilayat === user?.wilayat)).map(c => <article key={c.id} className="rounded-xl border p-3"><div className="flex justify-between"><p className="font-bold">{labelFor(c.wilayat, c.institution)} — {c.period} — {displayProcedure(c.procedure)}</p><span className="font-black">{c.score}</span></div><p className="mt-1 text-sm [overflow-wrap:anywhere]">{c.comment || "No comment"}</p><p className="mt-1 text-xs text-[var(--muted)]">Audited by: {c.auditorName || "—"} · Added at: {c.auditedAt ? formatMuscat(c.auditedAt) : "—"} · {c.wilayat}</p></article>)}{compPlanScores.filter(s => (s.comment || s.auditorName) && (isAdmin || s.wilayat === user?.wilayat)).length === 0 && <p className="text-sm">No comments yet.</p>}</div>
              </section>}
            </>}

            {tab === "Plans" && isAdmin && <section className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-xl font-black">Plans</h2><p className="mt-1 text-sm text-[var(--muted)]">Create Monthly plans (Jan-Dec). Plans are saved to the shared audit_data table — only the changed plan row is upserted. {dbLabel}</p></div><button type="button" onClick={restoreAllDeletedPlans} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100">Restore deleted / Clear tombstones ({planTombstones.length + compPlanTombstones.length})</button></div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <form onSubmit={createPlan} className="rounded-xl border p-4"><h3 className="font-extrabold">Create Part 1 plan</h3><label className="mt-3 block text-sm font-bold">Topic<select value={newPlan.topic} onChange={e => setNewPlan({ ...newPlan, topic: e.target.value })} className="mt-1 w-full">{TOPICS.map(t => <option key={t} value={t}>{t}</option>)}</select></label><label className="mt-3 block text-sm font-bold">Year<select value={newPlan.year} onChange={e => setNewPlan({ ...newPlan, year: Number(e.target.value) })} className="mt-1 w-full">{Array.from({ length: 14 }, (_, k) => 2027 + k).map(y => <option key={y} value={y}>{y}</option>)}</select></label><button disabled={busy} className="mt-3 w-full rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white disabled:opacity-50">Create Part 1 plan</button></form>
                <form onSubmit={createCompPlan} className="rounded-xl border p-4"><h3 className="font-extrabold">{editingCompPlanId ? "Edit Part 2 plan" : "Create Part 2 plan"}</h3><label className="mt-3 block text-sm font-bold">Category<select value={newCompPlan.category} onChange={e => { setNewCompPlan({ ...newCompPlan, category: e.target.value, procedures: Array(12).fill(null) as (string | null)[], feedback: Array(12).fill(false) as boolean[] }); setCompProcSearch(Array(12).fill(undefined as any)); setOpenProcIdx(null); }} className="mt-1 w-full">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></label><label className="mt-3 block text-sm font-bold">Year<select value={newCompPlan.year} onChange={e => { setNewCompPlan({ ...newCompPlan, year: Number(e.target.value), procedures: Array(12).fill(null) as (string | null)[], feedback: Array(12).fill(false) as boolean[] }); setCompProcSearch(Array(12).fill(undefined as any)); setOpenProcIdx(null); }} className="mt-1 w-full">{Array.from({ length: 14 }, (_, k) => 2027 + k).map(y => <option key={y} value={y}>{y}</option>)}</select></label><div className="mt-4 space-y-2"><p className="text-xs font-bold uppercase text-[var(--muted)]">Month by month — tap to open, type to filter inside the list</p>{MONTHS.map((m, i) => {
          const isFb = !!newCompPlan.feedback[i];
          const shown = isFb ? "Obtaining Feedback" : newCompPlan.procedures[i] ? newCompPlan.procedures[i]! : "Skipped";
          const q = (compProcSearch[i] ?? "").trim().toLowerCase();
          const filteredProcs = q ? effectiveProcedures.filter(pr => pr.toLowerCase().includes(q)) : effectiveProcedures;
          const isOpen = openProcIdx === i;
          return <div key={m} className="rounded-lg border p-2" style={isFb ? { background: "#ede9fe", borderColor: "#a78bfa" } : undefined}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-10 text-sm font-black">{m}</span>
              <div className="relative flex-1 min-w-[200px]">
                <input type="text"
                  value={isOpen ? (compProcSearch[i] ?? "") : (compProcSearch[i] === "" ? "" : shown)}
                  onFocus={() => { setOpenProcIdx(i); if (compProcSearch[i] === undefined || compProcSearch[i] === shown) setCompProcSearch(prev => { const n = [...prev]; n[i] = ""; return n; }); }}
                  onChange={e => { const v = e.target.value; setOpenProcIdx(i); setCompProcSearch(prev => { const n = [...prev]; n[i] = v; return n; }); }}
                  placeholder="🔍 Tap to open — type admin to filter…"
                  className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm font-bold"
                  style={{ minHeight: 44 }}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                {isOpen && <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[52vh] overflow-auto rounded-xl border bg-white shadow-xl">
                  <div className="sticky top-0 border-b bg-white px-2 py-1.5 text-[11px] font-bold uppercase text-[var(--muted)]">{q ? `${filteredProcs.length} matching "${compProcSearch[i]}"` : `All procedures — ${effectiveProcedures.length}`}</div>
                  <button type="button" onClick={() => { setCompMonth(i, "feedback"); setCompProcSearch(prev => { const n = [...prev]; n[i] = undefined as any; return n; }); setOpenProcIdx(null); }} className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-black ${isFb ? "bg-[#ede9fe] text-[#4c1d95]" : ""}`}><span className="rounded bg-[#4c1d95] px-2 py-0.5 text-[11px] text-white">Top</span> Obtaining Feedback</button>
                  <button type="button" onClick={() => { setCompMonth(i, "skip"); setCompProcSearch(prev => { const n = [...prev]; n[i] = undefined as any; return n; }); setOpenProcIdx(null); }} className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-bold ${!isFb && !newCompPlan.procedures[i] ? "bg-gray-100" : ""}`}><span className="rounded bg-gray-200 px-2 py-0.5 text-[11px]">Top</span> Skipped — no score</button>
                  {filteredProcs.map(pr => <button key={pr} type="button" onClick={() => { setCompMonth(i, "procedure", pr); setCompProcSearch(prev => { const n = [...prev]; n[i] = undefined as any; return n; }); setOpenProcIdx(null); }} className={`w-full px-3 py-2.5 text-left text-sm ${newCompPlan.procedures[i] === pr ? "bg-[var(--teal)] text-white font-black" : "hover:bg-[var(--surface2)]"}`}>{pr}</button>)}
                  {filteredProcs.length === 0 && <div className="px-3 py-3 text-sm text-[var(--muted)]">No procedure matches "{compProcSearch[i]}" — try another word</div>}
                </div>}
              </div>
              <button type="button" onClick={() => setOpenProcIdx(isOpen ? null : i)} className="rounded-lg border px-2.5 py-2 text-xs font-bold">{isOpen ? "Close ▲" : "Open ▼"}</button>
            </div>
            <div className="mt-1.5 text-xs">{isFb ? <span className="rounded bg-[#4c1d95] px-2 py-1 text-xs font-bold text-white">Obtaining Feedback</span> : !newCompPlan.procedures[i] ? <span className="text-[var(--muted)]">Skipped — no score</span> : <span className="text-[var(--muted)]">{shown}</span>}</div>
          </div>; })}</div>{editingCompPlanId && <button type="button" onClick={() => { setEditingCompPlanId(null); setCompProcSearch(Array(12).fill(undefined as any)); setOpenProcIdx(null); setNewCompPlan({ category: CATEGORIES[0] as string, year: 2027, procedures: Array(12).fill(null) as (string | null)[], feedback: Array(12).fill(false) as boolean[] }); }} className="mt-3 w-full rounded-lg border py-2 font-bold">Cancel edit — back to Create</button>}<button disabled={busy} className="mt-3 w-full rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white disabled:opacity-50">{editingCompPlanId ? "Save changes to Part 2 plan" : "Create Part 2 plan"}</button></form>
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div><h3 className="font-extrabold">Part 1 plans ({plans.length})</h3><div className="mt-2 space-y-2 max-h-[320px] overflow-auto">{plans.map(p => <div key={p.id} className="flex items-center gap-2 rounded border p-2 text-sm"><span className="font-bold">{p.topic} · {p.year}</span><span className="text-xs text-[var(--muted)]">{p.active ? "Active" : "Deactivated"}</span><button type="button" onClick={() => togglePart1PlanActive(p)} className="rounded-full border px-2 py-1 text-xs font-bold">{p.active ? "Deactivate" : "Activate"}</button><button type="button" onClick={() => deletePart1Plan(p)} className="rounded-full border border-red-300 px-2 py-1 text-xs font-bold text-red-700">Delete</button><button type="button" onClick={() => { setTopic(p.topic); setPlanId(p.id); setTab("Audit Grid"); setPart("1"); }} className="rounded-full border px-2 py-1 text-xs font-bold">Open</button></div>)}</div></div>
                <div><h3 className="font-extrabold">Part 2 plans ({compPlans.length})</h3><div className="mt-2 space-y-2 max-h-[320px] overflow-auto">{compPlans.map(p => <div key={p.id} className="flex items-center gap-2 rounded border p-2 text-sm"><span className="font-bold">{p.category} · {p.year}</span><span className="text-xs text-[var(--muted)]">{p.active ? "Active" : "Deactivated"} · {getBlocks(p).length} blocks</span><button type="button" onClick={() => toggleCompPlanActive(p)} className="rounded-full border px-2 py-1 text-xs font-bold">{p.active ? "Deactivate" : "Activate"}</button><button type="button" onClick={() => { setEditingCompPlanId(p.id); setCompProcSearch(Array(12).fill(undefined as any)); setOpenProcIdx(null); setNewCompPlan({ category: p.category, year: p.year, procedures: [...(p.procedures || Array(12).fill(null))], feedback: [...(p.feedback || Array(12).fill(false))] }); }} className="rounded-full border px-2 py-1 text-xs font-bold">Edit</button><button type="button" onClick={() => deleteCompPlan(p)} className="rounded-full border border-red-300 px-2 py-1 text-xs font-bold text-red-700">Delete</button><button type="button" onClick={() => { setCategory(p.category); setCompPlanId(p.id); setTab("Audit Grid"); setPart("2"); }} className="ml-auto rounded-full border px-2 py-1 text-xs font-bold">Open</button></div>)}</div></div>
              </div>
            </section>}

            {selectedCell && (
              <div className="fixed inset-0 overflow-y-auto bg-black/50 pt-[max(1rem,var(--safe-area-inset-top))] pb-6" style={{ zIndex: 10000 }}>
                <div className="min-h-full flex items-center justify-center px-3">
                  <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-5 shadow-2xl sheet-up">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-lg font-black">Enter audit score</h3>
                        <p className="mt-1 text-sm font-bold [overflow-wrap:anywhere]">{selectedCell.wilayat} • {labelFor(selectedCell.wilayat, selectedCell.institution)}</p>
                        <p className="text-sm font-bold [overflow-wrap:anywhere]">{selectedCell.part === "2" ? `${selectedCell.category || category} • ${displayProcedure(activeCompPlan?.procedures?.[MONTH_INDEX[selectedCell.period] ?? -1]) || "—"}` : `Part 1 • ${topic}`}</p>
                        <p className="text-sm font-bold [overflow-wrap:anywhere]">{selectedCell.part === "2" ? `${activeCompPlan?.year ?? ""} • ${(() => { const _b = blockForMonth(activeCompPlan, MONTH_INDEX[selectedCell.period] ?? -1); return _b ? blockLabel(_b) : selectedCell.period; })()}` : `${activePlan?.year ?? ""} • ${selectedCell.period}`}</p>
                      </div>
                      <button type="button" onClick={() => setSelectedCell(null)} aria-label="Close score dialog" className="rounded-full border p-1" style={{ minHeight: 44, minWidth: 44, touchAction: 'manipulation', cursor: 'pointer' }}><X size={18} /></button>
                    </div>
                    <div className="mt-4 space-y-3">
                      <label className="block text-sm font-bold">Score <span className="text-red-600">* Mandatory</span> (0-100 or NA)
                        <input
                          type="text"
                          inputMode="text"
                          autoCapitalize="characters"
                          autoCorrect="off"
                          value={scoreInput}
                          onChange={e => setScoreInput(e.target.value)}
                          placeholder="e.g. 95 or NA"
                          autoComplete="off"
                          className={`mt-1 w-full ${!isScoreValid(scoreInput) && scoreInput !== "" ? "border-red-500" : ""}`}
                          style={{ fontSize: 16, minHeight: 48 }}
                        />
                        <span className="mt-1 block text-[11px] text-[var(--muted)]">Mandatory — enter 0-100 or NA</span>
                      </label>
                      <label className="block text-sm font-bold">Your Name / Auditor Name <span className="text-red-600">* Mandatory</span>
                        <input
                          value={auditorNameInput}
                          onChange={e => setAuditorNameInput(e.target.value)}
                          placeholder="e.g. Salim Al Mamari"
                          className={`mt-1 w-full ${!isNameValid(auditorNameInput) && auditorNameInput !== "" ? "border-red-500" : ""}`}
                          style={{ fontSize: 16, minHeight: 48 }}
                        />
                        <span className="mt-1 block text-[11px] text-[var(--muted)]">Mandatory — will be shown as Audited by</span>
                      </label>
                      <label className="block text-sm font-bold">Comment <span className="text-[var(--muted)]">(Optional)</span>
                        <textarea value={commentInput} onChange={e => setCommentInput(e.target.value)} rows={3} placeholder="Add a comment for this audit... (optional)" className="mt-1 w-full" style={{ fontSize: 16, minHeight: 80 }} />
                      </label>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={saveCell}
                        disabled={busy || !isScoreValid(scoreInput) || !isNameValid(auditorNameInput)}
                        className="rounded-lg bg-[var(--teal)] px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                        style={{ minHeight: 48, touchAction: 'manipulation', cursor: 'pointer' }}
                      >
                        <CheckCircle2 className="mr-1 inline" size={16} />{busy ? "Saving…" : "Save audit"}
                      </button>
                      <button type="button" onClick={() => setSelectedCell(null)} disabled={busy} className="rounded-lg border px-4 py-3 font-bold" style={{ minHeight: 48, touchAction: 'manipulation', cursor: 'pointer' }}>Cancel</button>
                      <button type="button" onClick={deleteScore} disabled={busy} className="rounded-lg border border-red-300 px-3 py-3 font-bold text-red-700" style={{ minHeight: 48, touchAction: 'manipulation' }}><Trash2 className="mr-1 inline" size={16} />Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            
          </main>
        </>
      )}
      {showHelp && <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/50 pt-[max(1rem,var(--safe-area-inset-top))] pb-6"><div className="min-h-full flex items-center justify-center px-3"><div className="w-full max-w-xl rounded-2xl bg-[var(--surface)] p-5 shadow-2xl"><div className="flex justify-between"><h2 className="text-lg font-black">How to use — Monthly plans, blocks &amp; Feedback + Supabase sync</h2><button onClick={() => setShowHelp(false)} aria-label="Close help"><X /></button></div><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed"><li><strong>Header fixed:</strong> Green bar is now compact h-16 desktop (~64px), ~72px mobile stacked, not half page. Logo + title + role on same line desktop, compact stacked mobile.</li><li><strong>Secondary bars:</strong> Refresh + Live status in white bar, Part toggle + tabs in light gray bar, both below green header. Desktop shows tabs horizontal.</li><li><strong>Dashboard:</strong> grid grid-cols-1 lg:grid-cols-3 gap-4 — summary cards side-by-side on desktop.</li><li><strong>Audit Grid:</strong> Table scrolls horizontally on mobile (overflow-auto) but shows full on desktop. Main content starts right after header.</li><li><strong>Supabase sync:</strong> All saves upsert only the changed row to the shared audit_data table. Refresh re-fetches from the shared database and merges it — it never reloads the page and never logs you out.</li><li><strong>Mobile tap fix preserved:</strong> cell buttons with touch-action manipulation, fixed z-index 9999 dialog.</li></ol><button onClick={() => setShowHelp(false)} className="mt-4 w-full rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white">Got it</button></div></div></div>}
    </div>
  );
}
