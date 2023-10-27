# How to annotate an image

- [Add a new Annotation](#add-a-new-annotation)
- [Edit/Delete an existing Annotation](#editdelete-an-existing-annotation)
- [Draw a Shape](#draw-a-shape)
  * [Path](#path)
  * [Rectangle](#rectangle)
  * [Circle](#circle)
  * [Line](#line)
  * [Arrow line](#arrow-line)
  * [Polygon](#polygon)
  * [Text](#text)

## Add a new annotation {id=add-a-new-annotation}

1. Make sure that you are logged in.

	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/Login%20Check.png)

2. On the left hand side, beside the image you will see a `New` button. Click on it to open the `Create annotation` panel.

	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/NewButton.png)

	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/CreateAnnotationPanel.png)

3. Fill in the following fields:

	- Select the related anatomical term in the `Anatomy` field. (Required)
	- Enter any useful description of your annotation in the `Comments` field. You may format your text using the formatting icons above the field. (Optional)
	- The `Curation Status` field is `In Preparation` by default, which means it is not viewable to the public. You may change this field to `PI Review` if your lab uses that status for internal review or to `Submitted` to send it to the Hub for biocuration and subsequent release to the public.
	- Select the relevant `Principal Investigator`. (Required)
	- Select the relevant `Consortium`. (Required)

5. Select the desired annotation shape from the `Annotation Toolbar`. You may choose from pencil icon (freehand drawing), rectangle or circle.

	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/AnnotationToolbar.png)

6. Draw the shape in the desired location on the image. (You may use multiple and different shapes within the annotation). See [Draw a shape](#draw-a-shape) for more details about the different drawing options.

7. You may de-select the current shape by click on the same shape from the `Annotation Toolbar`.

8. To save your annotation, click on the `Save` button in the `Create annotation` panel.

	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/SaveButton.png)

## Edit/Delete an existing annotation {id=editdelete-an-existing-annotation}

1. Make sure that you are logged in.

2. Click on the `Edit Annotation` icon of the annotation that you want to edit.
	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/EditButton.png)

3. To change the color of the annotation, pick a different color from the color picker (red square). This will change the color of all the shapes of the annotation that share the original color.

	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/ColorPicker.png)
	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/ColorPicker2.png)

4. To delete a shape from this annotation, select the `Erase` tool from the annotation toolbar and click on the shape that you want to delete.

	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/DeleteButton.png)

5. To add a new shape, select the shape that you want from the annotation toolbar and start drawing it on the image.

	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/ShapeIcons.png)

6. After you are done making your changes, click on the `Save` button in the `Edit annotation` panel.

7. To delete the entire annotation, click on the `Delete` button in the `Edit annotation` panel.

	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/DeleteButton.png)

## Draw a shape {id=draw-a-shape}

### Path {id=path}

1. Select the path tool (pencil icon) from the annotation tool bar.
	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/Path.png)

2. Press and hold the left mouse button to draw the path on the image. Drag the mouse to draw the shape.

3. Let go of the mouse button when you are done drawing.

4. To add subsequent paths, repeat steps 2 & 3.

### Rectangle {id=rectangle}

1. Select the rectangle tool (square icon) from the annotation tool bar.

	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/Rectangle.png)

2. Press and hold the left mouse button to draw a rectangle on the image. Start dragging your shape with your mouse from the top-left corner to the bottom right corner of the area you want to annotate.

3. Let go of the mouse button when you are done drawing.

4. To add subsequent rectangles, repeat steps 2 & 3.

### Circle {id=circle}

1. Select the circle tool (circle icon) from the annotation tool bar.

	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/Circle.png)

2. Press and hold the left mouse button to draw the circle on the image. Start dragging your shape from the center of the area you want to annotate out to the desired radius.

3. Let go of the mouse button when you are done drawing.

4. To add subsequent circles, repeat steps 2 & 3.

### Line {id=line}
1. Select the line tool (line icon) from the annotation tool bar.
	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/Line.png)

2. Press and hold the left mouse button to draw the line on the image. Drag the mouse pointer to draw. As you drag the mouse, you will see the the line change its end point.

3. Let go of the mouse button when you are done drawing.

4. To add subsequent lines, repeat steps 2 & 3.

### Arrow line {id=arrow-line}

1. Select the arrow line tool (arrow icon) from the annotation tool bar.
	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/ArrowLine.png)

2. Press and hold the left mouse button to draw the arrow line on the image. Drag the mouse pointer to draw. As you drag the mouse, you will see the the arrow line change its end point.

3. Let go of the mouse button when you are done drawing.

4. To add subsequent arrow lines, repeat steps 2 & 3.

### Polygon {id=polygon}
1. Select the polygon tool (polygon icon) from the annotation tool bar.
	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/Polygon.png)

2. Press and hold the left mouse button to draw the first polygon edge on the image. Drag the mouse pointer to draw.

3. A new vertex can only be added between the first and last vertices that are already present. To add a new vertex, press and hold the mouse button. Move to pointer around to adjust the position of this vertex. You also see an edge between the first vertex & new vertex, and last vertex & new vertex as you move the pointer around.

4. Let go of the mouse button when you are done placing the edge on the image.

5. To add subsequent polygons, de-select the polygon icon from the annotation toolbar and select it again.

### Text {id=text}


1. Select the text tool ("A" icon) from the annotation tool bar.
	![](https://github.com/informatics-isi-edu/chaise/raw/master/docs/resources/viewer-annotation/Text.png)

2. Upon clicking the text option, you will see the font size selector beside the option. To adjust the font size, you can,
 - Click on "+" or "-" buttons.
 - Or, click on the displayed number to see the list of most common font sizes and pick one of those.
 - Or, Type a new number.

3. Click anywhere on the image that you would like to add the text.

4. Click inside the displayed textbox and write your text.

5. The text will wrap into the next line after writing a long text. If you want your text to be displayed on the same line, You can use the knob on the right side of the textbox to resize the box.

6. If you want to move the textbox, press and hold the left mouse button on the textbox and start moving your mouse. Releasing your left mouse button will stop this move.

7. To add subsequent texts, repeat step 3 & 4.
